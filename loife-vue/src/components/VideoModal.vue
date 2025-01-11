<template>
  <Teleport to="body">
    <div v-if="show" 
         class="modal fade show" 
         id="videoModal"
         style="display: block"
         role="dialog"
         aria-labelledby="videoModalLabel"
         @click.self="closeModal"
         aria-modal="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <iframe v-if="sanitizedVideoUrl"
                  id="videoIframe"
                  width="100%"
                  height="100%"
                  :src="sanitizedVideoUrl"
                  title="Video content"
                  frameborder="0"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  allowfullscreen>
          </iframe>
        </div>
      </div>
    </div>
    <div v-if="show" 
         class="modal-backdrop fade show" 
         @click="closeModal">
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { Teleport } from 'vue';
import { sanitizeVideoUrl } from '../utils/security';

const props = defineProps({
  show: Boolean,
  videoUrl: String
});

const emit = defineEmits(['update:show']);
const sanitizedVideoUrl = ref('');

watch(() => props.videoUrl, (newUrl) => {
  sanitizedVideoUrl.value = sanitizeVideoUrl(newUrl);
});

function closeModal() {
  emit('update:show', false);
}

function handleKeyDown(e) {
  if (e.key === 'Escape' && props.show) {
    closeModal();
  }
}

// Add and remove event listeners
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.modal-content {
  background-color: transparent;
  border: none;
  position: relative;
  z-index: 1051;
}

.modal-backdrop {
  z-index: 1050;
  pointer-events: auto;
}

iframe {
  aspect-ratio: 16/9;
  background: black;
}
</style>
