import { randomUUID } from 'node:crypto'
import Ajv from 'ajv'
import openapi from './cruise-control-openapi.json' with { type: 'json' }

const ajv = new Ajv({ strict: false, validateFormats: false, allErrors: true })
ajv.addSchema({ components: openapi.components }, 'cruise-control')
export const taskId = 'c2405587-64b5-4809-82cc-a41d0ef8793e'

export const clusterState = {
  version: 1,
  KafkaBrokerState: {
    ReplicaCountByBrokerId: { 1: 3, 2: 3 },
    LeaderCountByBrokerId: { 1: 2, 2: 1 },
    OutOfSyncCountByBrokerId: { 1: 0, 2: 0 },
    OfflineReplicaCountByBrokerId: { 1: 0, 2: 0 },
    OnlineLogDirsByBrokerId: { 1: ['/data'], 2: ['/data'] },
    OfflineLogDirsByBrokerId: { 1: [], 2: [] },
    IsController: { 1: true, 2: false },
    BrokerSetByBrokerId: {},
    Summary: {
      Brokers: 2,
      Topics: 2,
      Replicas: 6,
      Leaders: 3,
      AvgReplicationFactor: 2,
      AvgReplicasPerBroker: 3,
      AvgLeadersPerBroker: 1.5,
      MaxReplicasPerBroker: 3,
      MaxLeadersPerBroker: 2,
      StdReplicasPerBroker: 0,
      StdLeadersPerBroker: 0.5
    }
  },
  KafkaPartitionState: { offline: [], urp: [], 'with-offline-replicas': [], 'under-min-isr': [] }
}

const broker = {
  Host: 'broker.example.com',
  Rack: 'rack-1',
  Replicas: 3,
  Leaders: 1,
  DiskMB: 2048,
  CpuPct: 12.5,
  LeaderNwInRate: 2,
  FollowerNwInRate: 1,
  NwOutRate: 3,
  PnwOutRate: 4,
  DiskPct: 25,
  DiskCapacityMB: 8192,
  NetworkInCapacity: 100,
  NetworkOutCapacity: 100,
  NumCore: 4
}

const brokerStats = {
  brokers: [{ ...broker, Broker: 1, BrokerState: 'ALIVE', Leaders: 2 }, { ...broker, Broker: 2, BrokerState: 'ALIVE' }],
  hosts: [{
    ...broker,
    Replicas: 6,
    Leaders: 3,
    DiskMB: 4096,
    CpuPct: 25,
    LeaderNwInRate: 4,
    FollowerNwInRate: 2,
    NwOutRate: 6,
    PnwOutRate: 8,
    DiskCapacityMB: 16384,
    NetworkInCapacity: 200,
    NetworkOutCapacity: 200,
    NumCore: 8
  }]
}

export const load = { version: 1, ...brokerStats }

export const partitionLoad = {
  version: 1,
  records: [
    { topic: 'orders', partition: 0, leader: 1, followers: [2], cpu: 3.5, disk: 10.5, networkInbound: 1.5, networkOutbound: 2.5, msg_in: 20.5 },
    { topic: 'orders', partition: 1, leader: 2, followers: [1], cpu: 5, disk: 20, networkInbound: 2, networkOutbound: 3, msg_in: 30 },
    { topic: 'events', partition: 0, leader: 1, followers: [2], cpu: 2, disk: 5, networkInbound: 1, networkOutbound: 1, msg_in: 10 }
  ]
}

export const optimization = {
  version: 1,
  summary: {
    numReplicaMovements: 0,
    dataToMoveMB: 0,
    numIntraBrokerReplicaMovements: 0,
    intraBrokerDataToMoveMB: 0,
    numLeaderMovements: 0,
    recentWindows: 5,
    monitoredPartitionsPercentage: 100,
    excludedTopics: [],
    excludedBrokersForLeadership: [],
    excludedBrokersForReplicaMove: [],
    onDemandBalancednessScoreBefore: 100,
    onDemandBalancednessScoreAfter: 100,
    provisionStatus: 'RIGHT_SIZED',
    provisionRecommendation: ''
  },
  loadAfterOptimization: brokerStats,
  goalSummary: []
}

export const proposals = { ...optimization, loadBeforeOptimization: brokerStats, proposals: [] }

export const progress = {
  version: 1,
  progress: [{
    operation: 'Getting load',
    operationProgress: [
      { step: 'AGGREGATING_METRICS', description: 'Collecting metrics', completionPercentage: 50, 'time-in-ms': 25 }
    ]
  }]
}

const anomalyTypes = ['BROKER_FAILURE', 'GOAL_VIOLATION', 'METRIC_ANOMALY', 'DISK_FAILURE', 'TOPIC_ANOMALY', 'MAINTENANCE_EVENT']

export const state = {
  version: 1,
  MonitorState: {
    state: 'RUNNING',
    trained: true,
    trainingPct: 100,
    numMonitoredWindows: 5,
    numTotalPartitions: 3,
    numValidPartitions: 3,
    numFlawedPartitions: 0,
    monitoringCoveragePct: 100,
    reasonOfLatestPauseOrResume: ''
  },
  AnalyzerState: {
    isProposalReady: true,
    readyGoals: ['RackAwareGoal'],
    goalReadiness: [{
      name: 'RackAwareGoal',
      status: 'ready',
      modelCompleteRequirement: { includeAllTopics: true, minMonitoredPartitionsPercentage: 100, requiredNumSnapshots: 1 }
    }]
  },
  ExecutorState: { state: 'NO_TASK_IN_PROGRESS' },
  AnomalyDetectorState: {
    selfHealingDisabled: anomalyTypes.filter(type => type !== 'BROKER_FAILURE'),
    selfHealingEnabled: ['BROKER_FAILURE'],
    selfHealingEnabledRatio: Object.fromEntries(anomalyTypes.map(type => [type, type === 'BROKER_FAILURE' ? 1 : 0])),
    recentBrokerFailures: [],
    recentMetricAnomalies: [],
    recentGoalViolations: [],
    recentDiskFailures: [],
    recentTopicAnomalies: [],
    recentMaintenanceEvents: [],
    metrics: {
      meanTimeBetweenAnomaliesMs: Object.fromEntries(anomalyTypes.map(type => [type, 0])),
      meanTimeToStartFixMs: 0,
      numSelfHealingStarted: 0,
      numSelfHealingFailedToStart: 0,
      ongoingAnomalyDurationMs: 0
    },
    balancednessScore: 100
  }
}

export async function fulfillCruiseControl (route, data, { status = 200, taskId } = {}) {
  const json = typeof data !== 'string'
  const contentType = json ? 'application/json' : 'text/plain'
  const url = new URL(route.request().url())
  const method = route.request().method()
  const operation = openapi.paths[`/${url.pathname.split('/').pop()}`]?.[method.toLowerCase()]
  const response = operation?.responses[status] || (status >= 400 ? operation?.responses.default : undefined)
  let schema = response?.content?.[contentType]?.schema
  if (!schema && !operation && status >= 400) {
    schema = json ? { $ref: '#/components/schemas/ErrorResponse' } : { type: 'string' }
  }
  if (!schema) throw new Error(`Undocumented mock response: ${method} ${url.pathname} HTTP ${status} ${contentType}`)
  const validate = schema.$ref ? ajv.getSchema(`cruise-control${schema.$ref}`) : ajv.compile(schema)
  if (!validate(data)) throw new Error(`Invalid mock response: ${ajv.errorsText(validate.errors)}`)
  return route.fulfill({
    status,
    headers: {
      'Content-Type': `${contentType};charset=utf-8`,
      ...(taskId ? { 'User-Task-ID': taskId } : {})
    },
    body: json ? JSON.stringify(data) : data
  })
}

export async function mockCruiseControl (page) {
  const tasks = new Map()
  await page.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/static/config.csv')) {
      return route.fulfill({
        contentType: 'text/csv',
        body: 'east,alpha,/kafkacruisecontrol\neast,beta,/beta/kafkacruisecontrol\nwest,gamma,/gamma/kafkacruisecontrol'
      })
    }
    if (!url.pathname.includes('/kafkacruisecontrol/')) return route.continue()
    const endpoint = url.pathname.split('/').pop()
    const method = route.request().method()
    const params = url.searchParams
    const json = params.get('json')?.toLowerCase() === 'true'
    const error = (status, errorMessage) => fulfillCruiseControl(route,
      json ? { version: 1, errorMessage, stackTrace: '' } : errorMessage, { status })
    const operation = openapi.paths[`/${endpoint}`]?.[method.toLowerCase()]
    if (!operation) return error(404, `Unrecognized endpoint ${method} ${endpoint}.`)
    const parameters = operation.parameters.filter(parameter => parameter.in === 'query')
    const unknown = [...params.keys()].filter(name => !parameters.some(parameter => parameter.name.toLowerCase() === name.toLowerCase()))
    if (unknown.length) return error(400, `Unrecognized endpoint parameters in ${method} ${endpoint} request: ${unknown.join(', ')}.`)
    const missing = parameters.find(parameter => parameter.required && !params.get(parameter.name))
    if (missing) return error(400, `Missing required parameter ${missing.name}.`)
    for (const [name, value] of params) {
      if (name.includes('concurrent_') && (!/^\d+$/.test(value) || Number(value) < 1)) {
        return error(400, `${name} must be a positive integer.`)
      }
    }
    if (params.get('goals') && ['kafka_assigner', 'rebalance_disk', 'use_ready_default_goals'].some(name => params.get(name) === 'true')) {
      return error(400, 'Explicit goals are incompatible with the selected goal mode.')
    }
    if (params.get('kafka_assigner') === 'true' && params.get('rebalance_disk') === 'true') {
      return error(400, 'Kafka assigner and disk rebalance modes are mutually exclusive.')
    }
    if (params.has('brokerid_and_logdirs') && !params.get('brokerid_and_logdirs').split(',').every(pair => /^\d+-.+$/.test(pair))) {
      return error(400, 'Invalid brokerid_and_logdirs.')
    }
    const key = `${method} ${url.href}`
    const suppliedTask = route.request().headers()['user-task-id']
    if (suppliedTask && suppliedTask !== tasks.get(key)) return error(400, 'Unexpected User-Task-ID in the request.')
    if (!tasks.has(key)) tasks.set(key, randomUUID())
    const currentTask = tasks.get(key)
    const requestedStates = params.get('substates')?.toLowerCase().split(',')
    const stateNames = { monitor: 'MonitorState', analyzer: 'AnalyzerState', executor: 'ExecutorState', anomaly_detector: 'AnomalyDetectorState' }
    const responseState = requestedStates
      ? { version: 1, ...Object.fromEntries(requestedStates.map(name => [stateNames[name], state[stateNames[name]]])) }
      : { ...state }
    if (params.get('verbose') !== 'true' && responseState.AnalyzerState) {
      responseState.AnalyzerState = { ...responseState.AnalyzerState }
      delete responseState.AnalyzerState.goalReadiness
    }
    const result = params.get('verbose') === 'true' ? proposals : optimization
    const data = {
      kafka_cluster_state: clusterState,
      state: responseState,
      load,
      partition_load: partitionLoad,
      proposals: result,
      user_tasks: {
        version: 1,
        userTasks: [{ UserTaskId: taskId, ClientIdentity: 'test', StartMs: '1700000000000', Status: 'Completed', RequestURL: 'GET /kafkacruisecontrol/load?json=true' }]
      },
      review_board: {
        version: 1,
        RequestInfo: [{ Id: 1, SubmitterAddress: 'test', SubmissionTimeMs: 1700000000000, Status: 'PENDING_REVIEW', Reason: 'Routine balance', EndpointWithParams: '/rebalance?dryrun=true' }]
      },
      rebalance: result,
      add_broker: result,
      remove_broker: result,
      demote_broker: result,
      remove_disks: result
    }[endpoint]
    if (!data) throw new Error(`No fixture for Cruise Control endpoint: ${endpoint}`)
    if (!json) {
      if (endpoint !== 'demote_broker') throw new Error(`No plaintext fixture for ${endpoint}`)
      const rows = brokerStats.brokers.map(broker => [
        broker.Host, broker.Broker, broker.Rack, broker.DiskCapacityMB,
        `${broker.DiskMB}/${broker.DiskPct}`, broker.NumCore, broker.CpuPct,
        broker.NetworkInCapacity, broker.LeaderNwInRate, broker.FollowerNwInRate,
        broker.NetworkOutCapacity, broker.NwOutRate, broker.PnwOutRate,
        `${broker.Leaders}/${broker.Replicas}`
      ].join(','))
      const text = [
        `Cluster load after demoting broker [${params.get('brokerid')}]:`,
        'HOST BROKER RACK DISK_CAP(MB) DISK(MB)/_(%)_ CORE_NUM CPU(%) NW_IN_CAP(KB/s) LEADER_NW_IN(KB/s) FOLLOWER_NW_IN(KB/s) NW_OUT_CAP(KB/s) NW_OUT(KB/s) PNW_OUT(KB/s) LEADERS/REPLICAS',
        ...rows
      ].join('\n')
      return fulfillCruiseControl(route, text, { taskId: currentTask })
    }
    return fulfillCruiseControl(route, data, { taskId: currentTask })
  })
}
