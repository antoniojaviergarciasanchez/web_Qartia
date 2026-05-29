(function () {
	function initQartiaHomeSlider() {
		document.querySelectorAll(".royalSlider").forEach(function (slider) {
			var slides = Array.prototype.slice.call(slider.querySelectorAll(".rsContent"));
			var section = slider.closest(".l-section.with_slider");
			var slideImages = [];

			if (!slides.length) {
				return;
			}

			var currentSlide = Number(slider.dataset.qartiaCurrentSlide || "0");
			if (Number.isNaN(currentSlide) || currentSlide < 0 || currentSlide >= slides.length) {
				currentSlide = 0;
			}

			slides.forEach(function (slide, index) {
				var imageLink = slide.querySelector(".rsImg");
				var imageUrl = imageLink ? imageLink.getAttribute("href") : "";

				if (imageLink && imageUrl) {
					imageLink.style.backgroundImage = 'url("' + imageUrl + '")';
					imageLink.setAttribute("aria-label", "Imagen de cabecera " + (index + 1));
					slideImages[index] = imageUrl;
				}

				slide.classList.toggle("is-active", index === currentSlide);
			});

			function activateSlide(index) {
				slides.forEach(function (slide, slideIndex) {
					slide.classList.toggle("is-active", slideIndex === index);
				});

				if (section && slideImages[index]) {
					section.style.backgroundImage = 'url("' + slideImages[index] + '")';
				}
			}

			activateSlide(currentSlide);

			if (slides.length < 2 || slider.dataset.qartiaFallbackReady === "1") {
				return;
			}

			slider.dataset.qartiaFallbackReady = "1";
			slider.dataset.qartiaCurrentSlide = String(currentSlide);

			window.setInterval(function () {
				currentSlide = (currentSlide + 1) % slides.length;
				slider.dataset.qartiaCurrentSlide = String(currentSlide);
				activateSlide(currentSlide);
    }, 7800);
		});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initQartiaHomeSlider);
	} else {
		initQartiaHomeSlider();
	}

	window.addEventListener("load", initQartiaHomeSlider);
	window.setTimeout(initQartiaHomeSlider, 500);
	window.setTimeout(initQartiaHomeSlider, 1500);
})();
