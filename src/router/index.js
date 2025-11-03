// Copyright 2017-2019 LinkedIn Corp. Licensed under the BSD 2-Clause License (the "License"). See License in the project root for license information.

import { createRouter, createWebHistory } from 'vue-router'
import Page from '@/components/Page.vue'
import Load from '@/components/Load.vue'
import ReplicaLoad from '@/components/ReplicaLoad.vue'
import Proposals from '@/components/Proposals.vue'
import State from '@/components/State.vue'
import Monitor from '@/components/Monitor.vue'
import Executor from '@/components/Executor.vue'
import Analyzer from '@/components/Analyzer.vue'
import AnomalyDetector from '@/components/AnomalyDetector.vue'
import PartitionLoad from '@/components/PartitionLoad.vue'
import KafkaClusterState from '@/components/KafkaClusterState.vue'
import Preferences from '@/components/Preferences.vue'
import AdminBroker from '@/components/AdminBroker.vue'
import AdminSampling from '@/components/AdminSampling.vue'
import UserTasks from '@/components/UserTasks.vue'
import ConfigInsights from '@/components/ConfigInsights.vue'
import ResourceDistribution from '@/components/ResourceDistribution.vue'
import PeerReview from '@/components/PeerReview.vue'
import { useAppStore } from '@/store'
import Summary from '@/components/Summary.vue'

const router = createRouter({
  history: createWebHistory(),
  linkActiveClass: '',
  linkExactActiveClass: 'active',
  routes: [
    {
      name: 'main',
      path: '/',
      redirect: '/page'
    },
    {
      // Handle legacy hash routes
      path: '/a/b',
      redirect: '/page'
    },
    {
      // Handle direct summary access
      path: '/summary',
      redirect: '/page/summary'
    },
    {
      name: 'page',
      path: '/page/:group?/:cluster?',
      component: Page,
      props: true,
      children: [
        {
          name: 'page.default',
          path: '',
          redirect: 'summary'
        },
        {
          name: 'page.load',
          path: 'load',
          component: Load,
          props: true
        },
        {
          name: 'page.replicaload',
          path: 'replicaload',
          component: ReplicaLoad,
          props: true
        },
        {
          name: 'page.partitionload',
          path: 'partitionload',
          component: PartitionLoad,
          props: true
        },
        {
          name: 'page.proposals',
          path: 'proposals',
          component: Proposals,
          props: true
        },
        {
          name: 'page.state',
          path: 'state',
          component: State,
          props: true,
          children: [
            {
              name: 'page.state.default',
              path: '',
              redirect: 'monitor'
            },
            {
              name: 'page.state.executor',
              path: 'executor',
              component: Executor,
              props: true
            },
            {
              name: 'page.state.monitor',
              path: 'monitor',
              component: Monitor,
              props: true
            },
            {
              name: 'page.state.analyzer',
              path: 'analyzer',
              component: Analyzer,
              props: true
            },
            {
              name: 'page.state.anomaly_detector',
              path: 'anomaly_detector',
              component: AnomalyDetector,
              props: true
            }
          ]
        },
        {
          name: 'page.kafkaclusterstate',
          path: 'kafkaclusterstate',
          component: KafkaClusterState,
          props: true
        },

        {
          name: 'page.preferences',
          path: 'preferences',
          component: Preferences,
          props: false
        },
        {
          name: 'page.user_tasks',
          path: 'user_tasks',
          component: UserTasks,
          props: true
        },
        {
          name: 'page.config_insights',
          path: 'config_insights',
          component: ConfigInsights,
          props: false
        },
        {
          name: 'page.resource_distribution',
          path: 'resource_distribution',
          component: ResourceDistribution,
          props: true
        },
        {
          name: 'page.summary',
          path: 'summary',
          component: Summary,
          props: false
        },
        {
          name: 'page.admin_sampling',
          path: 'admin_sampling',
          component: AdminSampling,
          props: true
        },
        {
          name: 'page.admin_broker',
          path: 'admin_broker',
          component: AdminBroker,
          props: true
        },
        {
          name: 'page.review',
          path: 'review',
          component: PeerReview,
          props: true
        }
      ],
      props: true
    }
  ]
})

router.beforeEach((to, from, next) => {
  console.log('called before each : %s -> %s', to, from)
  const store = useAppStore()
  store.seturl(to)
  next()
})

export default router
