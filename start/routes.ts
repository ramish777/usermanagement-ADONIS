/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer''
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async ({ view }) => {
  return view.render('login')
})
Route.post('/login', 'UsersController.login')
 
Route.group(() => {
  Route.get('/dashboard/:user_name', 'UsersController.renderUserDetails');
  Route.get('/dashboard/:user_name/createUser', 'UsersController.renderCreateUser');
  Route.post('/created', 'UsersController.creation');
  Route.post('/dashboard/:user_name/editUser', 'UsersController.editUser');
  Route.get('/dashboard/:user_name/editpage', 'UsersController.renderEditPage');
  Route.post('/updateChanges', 'UsersController.updateUsers');
  Route.post('/dashboard/:username/deleteUser', 'UsersController.deleteUser');
  Route.post('/dashboard/:username/uploadUser' ,'UsersController.UploadUsers'); 
  Route.get('/logout', 'UsersController.logout');

}).middleware('auth')



