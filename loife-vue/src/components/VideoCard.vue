<template>
  <div class="card card-flyer loife" 
       role="button"
       tabindex="0"
       @click="openVideo"
       @mouseenter="onMouseEnter"
       @mouseleave="onMouseLeave"
       @keyup.enter="openVideo">
    <div class="image-box">
      <img class="card-img-top" 
           :src="thumbnailUrl" 
           :alt="`Video thumbnail ${imageId}`"
           loading="lazy"
           @error="handleImageError">
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  imageId: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['openVideo', 'mouseenter', 'mouseleave']);

const thumbnailUrl = computed(() => `/img/thumbnail/${props.imageId}.jpeg`);
const fullImageUrl = computed(() => `/img/full/${props.imageId}.jpeg`);

function openVideo() {
  emit('openVideo', props.videoUrl);
}

function onMouseEnter() {
  emit('mouseenter', fullImageUrl.value);
}

function onMouseLeave() {
  emit('mouseleave');
}

function handleImageError(e) {
  console.error(`Failed to load image: ${e.target.src}`);
  e.target.src = '/img/placeholder.jpeg';
}
</script>

<style scoped>
.card-flyer {
  cursor: pointer;
  transition: all 0.3s ease;
  width: 288px;
  height: 202px;
  margin: 10px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  padding: 0;
}

.image-box {
  width: 100%;
  height: 100%;
}

.image-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

.card-flyer:hover,
.card-flyer:focus {
  transform: translateY(-5px);
  outline: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.card-flyer:hover .image-box img,
.card-flyer:focus .image-box img {
  transform: scale(1.1);
}
</style>
