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
const SuggestionsController = () => import('#controllers/suggestions_controller')
const SyncController = () => import('#controllers/sync_controller')

router.on('/').render('pages/home')

router.get('/api/items', [ItemsController, 'index'])
router.get('/api/items/batch', [ItemsController, 'batch'])
router.get('/api/items/:id', [ItemsController, 'show'])
router.get('/api/suggestions', [SuggestionsController, 'index'])
router.get('/api/sync/status', [SyncController, 'status'])
