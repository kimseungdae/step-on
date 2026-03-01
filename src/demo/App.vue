<template>
  <div id="step-on-app">
    <header>
      <h1>step-on</h1>
      <p>Animated step-by-step column arithmetic</p>
    </header>
    <router-view />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f7;
  color: #1d1d1f;
}

#step-on-app {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 16px;
}

header {
  text-align: center;
  margin-bottom: 32px;
}

header h1 {
  font-size: 2rem;
  font-weight: 700;
}

header p {
  color: #6e6e73;
  margin-top: 4px;
}
</style>
