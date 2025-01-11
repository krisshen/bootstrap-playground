<script setup>
import { ref, onMounted } from 'vue';
import VideoCard from './components/VideoCard.vue';
import VideoModal from './components/VideoModal.vue';
import { generateRandomNumbers, getImageIds } from './utils/security';
import videos from '../data/loife_videos';

const showModal = ref(false);
const currentVideoUrl = ref('');
const imageIds = ref([]);
const backgroundImage = ref('');
const isHovering = ref(false);
const isTransitioning = ref(false);

onMounted(() => {
  const randomNumbers = generateRandomNumbers(8);
  imageIds.value = getImageIds(randomNumbers);
});

function openVideo(videoUrl) {
  currentVideoUrl.value = videoUrl;
  showModal.value = true;
}

function updateBackground(imageUrl) {
  // Only update background if we're hovering over a card and not in transition
  if (imageUrl && !isTransitioning.value) {
    isTransitioning.value = true;
    backgroundImage.value = imageUrl;
    isHovering.value = true;
    
    // Reset transition lock after animation completes
    setTimeout(() => {
      isTransitioning.value = false;
    }, 900); // Match the CSS transition duration
  }
}

function onCardMouseEnter(imageUrl) {
  updateBackground(imageUrl);
}

function onCardMouseLeave() {
  // Only clear background if we're not hovering over any card
  setTimeout(() => {
    if (!isHovering.value) {
      // backgroundImage.value = '';
    }
  }, 100);
}
</script>

<template>
  <div>
    <div class="cards-container"
         @mouseleave="isHovering = false">
      <div class="landing"
           :style="{
             backgroundImage: backgroundImage ? `url('${backgroundImage}')` : 'none',
             opacity: backgroundImage ? 0.8 : 0
           }">
      </div>

      <div v-for="(row, rowIndex) in 4" :key="rowIndex" class="row d-flex justify-content-center">
        <VideoCard v-for="(_, colIndex) in 2" 
                  :key="colIndex"
                  :image-id="imageIds[rowIndex * 2 + colIndex]"
                  :video-url="videos[imageIds[rowIndex * 2 + colIndex]]"
                  @open-video="openVideo"
                  @mouseenter="onCardMouseEnter($event, imageIds[rowIndex * 2 + colIndex])"
                  @mouseleave="onCardMouseLeave" />
      </div>
    </div>

    <VideoModal v-model:show="showModal"
                :video-url="currentVideoUrl" />
  </div>
</template>

<style>
@import 'bootstrap/dist/css/bootstrap.min.css';

.cards-container {
  position: relative;
  padding: 2rem;
  z-index: 1;
}

.landing {
  position: fixed;
  width: 100%;
  height: 100vh;
  top: 0;
  left: 0;
  z-index: -1;
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  opacity: 0;
  transition: all 0.9s ease-in-out;
  -webkit-transition: all 0.9s ease-in-out;
  -moz-transition: all 0.9s ease-in-out;
  -o-transition: all 0.9s ease-in-out;
  -ms-transition: all 0.9s ease-in-out;
}

.landing::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: -1;
  transition: opacity 0.9s ease-in-out;
}

.row {
  margin-bottom: 2rem;
  position: relative;
  z-index: 2;
}
</style>
