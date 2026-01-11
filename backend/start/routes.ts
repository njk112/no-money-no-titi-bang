/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const ItemsController = () => import('#controllers/items_controller')

router.on('/').render('pages/home')

router.get('/api/items', [ItemsController, 'index'])
