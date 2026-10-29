<!-- Copyright 2017-2019 LinkedIn Corp. Licensed under the BSD 2-Clause License (the "License"). See License in the project root for license information. -->
<template>
  <span>
    <!-- ALIVE, DEAD, NEW, DEMOTED, BAD_DISKS -->
    <span v-if='state == "NEW"' class="badge text-bg-primary">{{ state }}</span>
    <span v-else-if='state == "ALIVE"' class="badge text-bg-success">{{ state }}</span>
    <span v-else-if='state == "DEAD"' class="badge text-bg-danger">{{ state }}</span>
    <span v-else-if='state == "DEMOTED"' class="badge text-bg-secondary">{{ state }}</span>
    <span v-else-if='state == "BAD_DISKS"' class="badge text-bg-warning">{{ state }}</span>
    <span v-else class="badge">{{ state }}</span>
  </span>
</template>

<script>
export default {
  name: 'BrokerState',
  props: {
    state: String
  }
}
</script>
