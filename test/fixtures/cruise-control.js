export const clusterState = {
  KafkaBrokerState: {
    ReplicaCountByBrokerId: { 1: 3, 2: 3 },
    LeaderCountByBrokerId: { 1: 2, 2: 1 },
    OutOfSyncCountByBrokerId: { 1: 0, 2: 0 },
    OfflineReplicaCountByBrokerId: { 1: 0, 2: 0 },
    OnlineLogDirsByBrokerId: { 1: ['/data'], 2: ['/data'] },
    OfflineLogDirsByBrokerId: { 1: [], 2: [] }
  },
  KafkaPartitionState: { offline: [], urp: [], 'with-offline-replicas': [], 'under-min-isr': [] }
}

const broker = {
  BrokerState: 'ALIVE',
  Host: 'broker.example.com',
  Replicas: 3,
  Leaders: 1,
  DiskMB: 2048,
  CpuPct: 12.5,
  LeaderNwInRate: 2,
  FollowerNwInRate: 1,
  NwOutRate: 3,
  PnwOutRate: 4
}

export const load = {
  brokers: [{ ...broker, Broker: 1 }, { ...broker, Broker: 2 }],
  hosts: [{ ...broker }]
}

export const partitionLoad = {
  records: [
    { topic: 'orders', partition: 0, leader: 1, followers: [2], cpu: 3, disk: 10, networkInbound: 1, networkOutbound: 2 },
    { topic: 'orders', partition: 1, leader: 2, followers: [1], cpu: 5, disk: 20, networkInbound: 2, networkOutbound: 3 },
    { topic: 'events', partition: 0, leader: 1, followers: [2], cpu: 2, disk: 5, networkInbound: 1, networkOutbound: 1 }
  ]
}

export const proposals = {
  summary: { numReplicaMovements: 1, numLeaderMovements: 2, recentWindows: 5, dataToMoveMB: 2048, monitoredPartitionsPercentage: 100 },
  loadBeforeOptimization: load,
  loadAfterOptimization: load,
  goalSummary: []
}

export const progress = {
  progress: [{
    operation: 'Getting load',
    operationProgress: [
      { step: 'AGGREGATING_METRICS', description: 'Collecting metrics', completionPercentage: 50, 'time-in-ms': 25 }
    ]
  }]
}

const state = {
  MonitorState: {
    state: 'RUNNING',
    trained: true,
    trainingPct: 100,
    numMonitoredWindows: 5,
    numTotalPartitions: 3,
    numValidPartitions: 3,
    numFlawedPartitions: 0
  },
  AnalyzerState: {
    isProposalReady: true,
    goalReadiness: [{
      name: 'RackAwareGoal',
      status: 'READY',
      modelCompleteRequirement: { includeAllTopics: true, minMonitoredPartitionsPercentage: 100, requiredNumSnapshots: 1 }
    }]
  },
  ExecutorState: { state: 'NO_TASK_IN_PROGRESS' },
  AnomalyDetectorState: {
    selfHealingDisabled: [],
    selfHealingEnabled: ['BROKER_FAILURE'],
    recentBrokerFailures: [],
    recentMetricAnomalies: [],
    recentGoalViolations: [],
    recentIntraBrokerGoalViolations: []
  }
}

export async function mockCruiseControl (page) {
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
    const data = {
      kafka_cluster_state: clusterState,
      state,
      load: url.searchParams.get('granularity') === 'replica'
        ? {
            racks: [{
              rackid: 'rack-1',
              hosts: [{
                name: 'broker.example.com',
                brokers: [{ brokerid: 1, replicas: [{ topic: 'orders', partition: 0, isLeader: true }] }]
              }]
            }]
          }
        : load,
      partition_load: partitionLoad,
      proposals,
      user_tasks: {
        userTasks: [{ UserTaskId: 'task-1', ClientIdentity: 'test', StartMs: 1700000000000, Status: 'Completed', RequestURL: '/load' }]
      },
      review_board: {
        RequestInfo: [{ Id: 1, SubmitterAddress: 'test', SubmissionTimeMs: 1700000000000, Status: 'PENDING_REVIEW', Reason: 'Routine balance', EndpointWithParams: '/rebalance?dryrun=true' }]
      },
      rebalance: { message: 'Dry run accepted' }
    }[endpoint]
    if (!data) throw new Error(`Unexpected Cruise Control endpoint: ${endpoint}`)
    return route.fulfill({ json: data, headers: { 'User-Task-ID': 'task-1' } })
  })
}
