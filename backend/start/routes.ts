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
const RegimeController = () => import('#controllers/regime_controller')

router.on('/').render('pages/home')

router.get('/api/items', [ItemsController, 'index'])
router.get('/api/items/batch', [ItemsController, 'batch'])
router.get('/api/items/:id', [ItemsController, 'show'])
router.get('/api/suggestions', [SuggestionsController, 'index'])
router.get('/api/sync/status', [SyncController, 'status'])
router.get('/api/regime/segments/:itemId', [RegimeController, 'index'])
router.get('/api/regime/thresholds', [RegimeController, 'getThresholds'])
router.put('/api/regime/thresholds', [RegimeController, 'updateThresholds'])
router.post('/api/regime/recalculate', [RegimeController, 'recalculate'])
router.get('/api/regime/export/:itemId', [RegimeController, 'export'])
