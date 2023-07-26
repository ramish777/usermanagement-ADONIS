import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'
//import Application from '@ioc:Adonis/Core/Application'
import csvParser from 'csv-parser';
import fs from 'fs';


export default class UsersController {

  public async login({request,response}: HttpContextContract) {
        //providing for typescript compatibility
        const validationSchema = schema.create({
            login: schema.string(),
            password: schema.string()
          })
      
          const validatedData = await request.validate({
            schema: validationSchema,
            messages: {
              'login.required': 'Login is required',
              'password.required': 'Password is required'
            }
          })

          
        // Check if the username and password match values in the Lucid schema
    const user = await User.query()
    .where('username', validatedData.login)
    .andWhere('password', validatedData.password)
    .first()


    if (user) {
      return response.redirect(`/dashboard/${user.username}`)
    } else {
      // Invalid login credentials, handle accordingly (e.g., show error message)
      // For example, you can store the error message in a session flash
      // and redirect back to the login page.
      //session.flash({ loginError: 'Incorrect username or password' })
      return response.redirect('/')
    }
  }

  public async renderUserDetails({request,response, params, view}: HttpContextContract) {
    const { user_name } = params;

    try {
      const user = await User.findBy('username', user_name);
      if (user) {
        if (user.role_name === 'user') {
          return view.render('userpage', { user });
        } else {
          const page = request.input('page', 1)
          const data = await User.query().where('role_name', 'user').paginate(page,1);
          const size =data.length;
          return view.render('adminpage', { user,
                                            data,
                                            size,
                                            page }
          );
        }
      }
    } catch (error) {
      console.log('Error in renderUserDetails function', error);
      return response.redirect('/');
    }
  }

  public renderCreateUser({request,view}: HttpContextContract){
    const previousUrl = request.header('Referer') || '/';
    console.log(previousUrl);
    return view.render('createuser', { previousUrl });
  }

  public async creation({ request, response }) {
    const previousUrl = request.input('previousUrl');
    const name = request.input('name');
    const new_username = request.input('username');
    const password = request.input('password');
    const occupation = request.input('occupation');
    const age = request.input('age');
    const role_name = 'user';
  
    try {
      const existingUser = await User.findBy('username', new_username);
  
      if (!existingUser) {
        // Hash the password before saving
        //const hashedPassword = await Hash.make(password);
  
        // Create a new user record
        await User.create({
          username: new_username,
          password: password,
          name,
          occupation,
          age,
          role_name
        });
  
        response.redirect(previousUrl); // Redirect to the specified URL
      } else {
        // Handle the case when the user already exists
        // You can redirect or render a view here to show an error message
        response.send('User already exists.');
      }
    } catch (error) {
      console.log('Error:', error);
      response.redirect(previousUrl); // Redirect to login page if there's an error
    }
  }

  public async editUser({ request, response }) {
    const previousUrl = request.header('Referer') || '/';
    const host_username = previousUrl.split('/').pop().split('?')[0];
    const username = request.input('username');
    const name = request.input('name');
    const age = request.input('age');
    const occupation = request.input('occupation');
    const password = request.input('password');

    try {
      const user = await User.findBy('username', username);

      if (user) {
        response.redirect(`/dashboard/${host_username}/editpage?name=${name}&username=${username}&age=${age}&occupation=${occupation}&password=${password}`);      
      } 
        else {
        console.log('User not found');
        response.redirect('/');
      }
    } catch (error) {
      console.log('Error finding user:', error);
      response.redirect('/');
    }
  }

  public renderEditPage({ request, view }: HttpContextContract) {
    const urlParams = new URLSearchParams(request.qs());
    const username = urlParams.get('username');
    console.log('username : ' + username);
    const name = request.input('name');
    const age = request.input('age');
    const occupation = request.input('occupation');
    const password = request.input('password');
    return view.render('editpage', { username, name, age, occupation, password });
  }

  public async updateUsers({ request, response }: HttpContextContract) {
    const previousUrl = request.header('Referer') || '/';
    const url = new URL(previousUrl);
    const path = url.pathname;
    const updatedPath = path.replace('/editpage', '');
    const name = request.input('name');
    const username = request.input('username');
    const password = request.input('password');
    const occupation = request.input('occupation');
    const age = request.input('age');

    await User
    .query()
    .where('username', username)
    .update({ name: name, age: age, occupation:occupation, password:password });

    console.log('User updated');
    response.redirect(updatedPath);
  }

  public async deleteUser({ request, response }) {
    const username = request.input('username');
    const previousUrl = request.header('Referer') || '/';

    try {
      // Call the method to delete the user from the database
      await User.query().where('username', username).delete()
      console.log('User deleted');
      response.redirect(previousUrl);
    } catch (error) {
      console.log('Error deleting user:', error);
      response.redirect('/'); // Redirect to an error page if there's an error in deleting the user
    }
  }

  public async UploadUsers({ request,response }: HttpContextContract) {
    const previousUrl = request.header('Referer') || '/';
    console.log(previousUrl)
    const userFile = request.file('userFile', {
      size: '10mb',
      extnames: ['csv'],
    });

    if (!userFile) {
      return 'You must select a CSV file to upload.';
    }

    await userFile.move('uploads', {
      name: `${new Date().getTime()}_${userFile.clientName}`,
      overwrite: true,
    });
    const uploadedFilePath = `uploads/${userFile.fileName}`;
    
    // Read the uploaded CSV file and create users from its data

    await new Promise((resolve, reject) => {
      fs.createReadStream(uploadedFilePath)
        .pipe(csvParser())
        .on('data', async (row: any) => {
          const { name, username, password, occupation, age } = row;
          const role_name = 'user';

          try {
            // Check if a user with the same username already exists
            const existingUser = await User.findBy('username', username);
            if (existingUser) {
              console.log(`User with username ${username} already exists. Skipping creation.`);
            } else {
              console.log('Creating user:', name, username, password, occupation, age, role_name);
              await User.create({
                name,
                username,
                password,
                occupation,
                age,
                role_name,
              });
            }
          } catch (error) {
            // Handle any errors that occur during user creation
            console.error('Error creating user:', error.message);
          }
        })
        .on('end', () => {
          console.log('CSV file processing complete');
          resolve(response.redirect().toPath(previousUrl)); // Resolve the Promise when CSV processing is complete
        })
        .on('error', (error: Error) => {
          console.error('CSV processing error:', error.message);
          reject(error); // Reject the Promise if there's an error during CSV processing
        });
    });

    response.redirect().toPath(previousUrl); // Redirect back to the previous URL
  }

    // fs.createReadStream(uploadedFilePath)
    // .pipe(csvParser())
    
    // .on('data', async (row: any) => {
    //   console.log('data', row)
    //   //console.log('CSV Data:', row.name);
    //     // Assuming the CSV file headers are 'name', 'username', 'password', 'occupation', and 'age'
    //     const name=row.name
    //     const username=row.username
    //     const password=row.password
    //     const occupation=row.occupation
    //     const age=row.age
    //     const role_name='user'
    //     // Here, you can create users using the extracted data
    //     // You can replace the console.log with actual user creation code
    //     // Check if a user with the same username already exists
    //     const existingUser = await User.findBy('username', username);
    //     if (existingUser) {
    //       console.log(`User with username ${username} already exists. Skipping creation.`);
    //     } else {
    //       console.log('Creating user:', name, username, password, occupation, age, role_name);
    //       await User.create({
    //         name,
    //         username,
    //         password,
    //         occupation,
    //         age,
    //         role_name,
    //       });
          
    //     }
    //   })
    //   .on('end', () => {
    //     console.log('CSV file processing complete');
    //     response.redirect(previousUrl);
    //     console.log('here');
    //   });
  
  public async logout({auth,response}:HttpContextContract){
    await auth.logout()
    return response.redirect('/');
  }
}









