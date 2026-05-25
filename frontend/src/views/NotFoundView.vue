<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-8">
    <div class="text-center max-w-sm animate-fade-in-up">
      <div class="w-24 h-24 bg-brand-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <span class="text-4xl">🔍</span>
      </div>
      <h1 class="text-6xl font-extrabold text-brand-600 mb-3">404</h1>
      <h2 class="text-xl font-bold text-gray-900 mb-2">Page not found</h2>
      <p class="text-gray-500 text-sm mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <RouterLink to="/dashboard" class="btn-primary inline-flex">
        ← Back to Dashboard
      </RouterLink>
    </div>
  </div>
</template>
