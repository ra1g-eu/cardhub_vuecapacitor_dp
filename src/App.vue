<template>
  <v-app full-height class="bg-yellow-darken-1">
      <router-view/>
  </v-app>
</template>

<script>

export default {
  name: 'App',
  created() {
    document.title = 'CardHub - jedno miesto pre všetky zákaznícke karty';
  }
}
</script>
