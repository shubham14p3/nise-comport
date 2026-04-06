// Helper function to build YouTube embed URL
function buildYouTubeEmbed({
    playlistId = '',
    videoId = '',
    videoIndex = ''
}) {
    let url = '';

    // Case 1: Specific video ID provided
    if (videoId) {
        url = 'https://www.youtube.com/embed/' + encodeURIComponent(videoId) + '?rel=0&autoplay=1';
    }
    // Case 2: Playlist provided (with or without index)
    else if (playlistId) {
        if (videoIndex) {
            // Playlist + Index → Specific video in playlist
            url =
                'https://www.youtube.com/embed?listType=playlist&list=' +
                encodeURIComponent(playlistId) +
                '&index=' +
                encodeURIComponent(videoIndex) +
                '&rel=0&autoplay=1';
        } else {
            // Only Playlist → Entire playlist
            url =
                'https://www.youtube.com/embed/videoseries?list=' +
                encodeURIComponent(playlistId) +
                '&rel=0&autoplay=1';
        }
    }

    return url;
}

document.addEventListener('DOMContentLoaded', function () {
    const playButtons = document.querySelectorAll('.play-button');
    const modal = document.getElementById('video-modal');
    const backdrop = modal.querySelector('.video-modal-backdrop');
    const iframeWrap = modal.querySelector('.video-iframe-wrap');
    const closeBtn = modal.querySelector('.video-close');

    function openModal(btn) {
        const playlist = btn.getAttribute('data-playlist') || '';
        const video = btn.getAttribute('data-video') || '';
        const index = btn.getAttribute('data-index') || '';

        const embedUrl = buildYouTubeEmbed({
            playlistId: playlist.trim(),
            videoId: video.trim(),
            videoIndex: index.trim(),
        });

        if (!embedUrl) return;

        // Inject iframe dynamically
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', embedUrl);
        iframe.setAttribute(
            'allow',
            'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
        );
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('title', 'Video player');

        iframeWrap.innerHTML = '';
        iframeWrap.appendChild(iframe);

        modal.setAttribute('aria-hidden', 'false');
        closeBtn.focus();
    }

    function closeModal() {
        modal.setAttribute('aria-hidden', 'true');
        iframeWrap.innerHTML = ''; // stop playback
    }

    // Attach click event to all play buttons
    playButtons.forEach((btn) => {
        btn.addEventListener('click', () => openModal(btn));
    });

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
            closeModal();
        }
    });
});


//lode only one slider js

document.addEventListener("DOMContentLoaded", function () {

    // Keep global references of typing intervals
    let headingTyping = null;
    let paragraphTyping = null;

    function typeText(element, text, speed = 50, callback) {
        element.innerHTML = "";
        let i = 0;

        // Clear any existing interval before starting a new one
        if (element.dataset.intervalId) {
            clearInterval(element.dataset.intervalId);
        }

        let typing = setInterval(() => {
            element.innerHTML += text.charAt(i);
            i++;
            if (i > text.length) {
                clearInterval(typing);
                element.removeAttribute("data-interval-id");
                if (callback) callback();
            }
        }, speed);

        element.dataset.intervalId = typing; // Save reference to element
    }

    document.querySelectorAll(".custom-slider-section").forEach(section => {
        const slidesData = JSON.parse(section.getAttribute("data-slides"));
        const wrapper = section.querySelector(".slider-wrapper");
        const headingEl = section.querySelector(".slider-heading");
        const paragraphEl = section.querySelector(".slider-paragraph");
        const prevBtn = section.querySelector(".slider-btn.prev");
        const nextBtn = section.querySelector(".slider-btn.next");
        let currentIndex = 0;

        // Generate images dynamically
        slidesData.forEach((slide, i) => {
            const imgEl = document.createElement("img");
            imgEl.src = slide.img;
            imgEl.alt = slide.h;
            imgEl.classList.add("slide");
            if (i === 0) imgEl.classList.add("active");
            wrapper.appendChild(imgEl);
        });

        const slides = wrapper.querySelectorAll(".slide");

        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove("active"));
            slides[index].classList.add("active");

            // Clear old text & stop old intervals
            if (headingEl.dataset.intervalId) {
                clearInterval(headingEl.dataset.intervalId);
            }
            if (paragraphEl.dataset.intervalId) {
                clearInterval(paragraphEl.dataset.intervalId);
            }

            headingEl.innerHTML = "";
            paragraphEl.innerHTML = "";

            typeText(headingEl, slidesData[index].h, 30, () => {
                typeText(paragraphEl, slidesData[index].p, 10);
            });
        }

        nextBtn.addEventListener("click", () => {
            currentIndex = (currentIndex + 1) % slides.length;
            showSlide(currentIndex);
        });

        prevBtn.addEventListener("click", () => {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            showSlide(currentIndex);
        });

        // Show first slide immediately
        showSlide(currentIndex);
    });
});

 function copyToClipboard(text, btn) {
      if (!navigator.clipboard) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          /* ignore */
        }
        document.body.removeChild(ta);
      } else {
        navigator.clipboard.writeText(text).catch(function () {
          /* ignore errors */
        });
      }

      const original = btn.innerText;
      btn.innerText = 'Copied!';
      btn.disabled = true;
      setTimeout(function () {
        btn.innerText = original;
        btn.disabled = false;
      }, 1200);
    }

    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('.dc-copy').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          const text = btn.getAttribute('data-copy');
          if (!text) return;
          copyToClipboard(text, btn);
        });
      });

      document.querySelectorAll('.pw-field').forEach(function (container) {
        const input = container.querySelector('input');
        const toggle = container.querySelector('.pw-toggle');
        if (!input || !toggle) return;

        toggle.addEventListener('click', function () {
          const isPassword = input.getAttribute('type') === 'password';
          if (isPassword) {
            input.setAttribute('type', 'text');
            toggle.innerText = 'Hide';
            toggle.setAttribute('aria-pressed', 'true');
          } else {
            input.setAttribute('type', 'password');
            toggle.innerText = 'Show';
            toggle.setAttribute('aria-pressed', 'false');
          }
        });
      });
    });