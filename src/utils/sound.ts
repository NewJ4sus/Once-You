import notificationSound from '@/assets/media/notification-2.mp3';

class SoundManager {
  private audio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.src = notificationSound;
      // Предзагрузка звука
      this.audio.load();
    }
  }

  async play() {
    try {
      if (!this.audio) {
        console.error('Audio instance not created');
        return;
      }
      
      console.log('Audio state:', {
        readyState: this.audio.readyState,
        paused: this.audio.paused,
        src: this.audio.src,
        error: this.audio.error
      });
      
      this.audio.currentTime = 0;
      await this.audio.play();
    } catch (error) {
      console.error('Detailed error playing sound:', {
        error,
        audioState: this.audio?.readyState,
        src: this.audio?.src
      });
    }
  }
}

// Создаем единственный экземпляр
export const soundManager = new SoundManager(); 