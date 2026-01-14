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
const GroupsController = () => import('#controllers/groups_controller')

router.on('/').render('pages/home')

router.get('/api/items', [ItemsController, 'index'])
router.get('/api/items/batch', [ItemsController, 'batch'])
router.patch('/api/items/batch-group', [ItemsController, 'batchUpdateGroup'])
router.get('/api/items/:id', [ItemsController, 'show'])
router.patch('/api/items/:id/group', [ItemsController, 'updateGroup'])
router.get('/api/suggestions', [SuggestionsController, 'index'])
router.get('/api/sync/status', [SyncController, 'status'])
router.get('/api/regime/segments/:itemId', [RegimeController, 'index'])
router.get('/api/regime/thresholds', [RegimeController, 'getThresholds'])
router.put('/api/regime/thresholds', [RegimeController, 'updateThresholds'])
router.post('/api/regime/recalculate', [RegimeController, 'recalculate'])
router.get('/api/regime/export/:itemId', [RegimeController, 'export'])
router.post('/api/regime/calibrate', [RegimeController, 'calibrate'])
router.get('/api/groups', [GroupsController, 'index'])
router.get('/api/groups/stats', [GroupsController, 'stats'])
router.post('/api/groups', [GroupsController, 'create'])
router.put('/api/groups/:id', [GroupsController, 'update'])
router.delete('/api/groups/:id', [GroupsController, 'destroy'])
