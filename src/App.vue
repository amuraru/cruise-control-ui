<!-- Copyright 2017-2019 LinkedIn Corp. Licensed under the BSD 2-Clause License (the "License"). See License in the project root for license information. -->
<template>
  <div id="app">
    <app-nav></app-nav>
    <div class="container-fluid" id="page">
      <router-view v-slot="{ Component }">
        <transition mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
    <hr>
    <p class="text-center">&copy; 2017-2019 <a href="https://linkedin.com">LinkedIn</a>.</p>
  </div>
</template>

<script>
import AppNav from '@/components/AppNav.vue'
export default {
  name: 'app',
  components: {
    AppNav
  }
}
</script>

<style>
#page { margin-top: 90px; }
</style>
