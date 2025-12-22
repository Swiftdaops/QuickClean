const DEFAULT_PRODUCT_ADDED_SOUND = "https://res.cloudinary.com/dnitzkowt/video/upload/v1766339273/new-notification-3-398649_pxhiar.mp3";

let _audio = null;

export function playProductAddedSound(url = DEFAULT_PRODUCT_ADDED_SOUND) {
	try {
		if (typeof window === 'undefined') return;
		if (!_audio) {
			_audio = new Audio(url);
			_audio.preload = 'auto';
		} else if (_audio.src !== url) {
			_audio.src = url;
		}

		// attempt to play; caller should ensure user gesture when required
		_audio.currentTime = 0;
		_audio.play().catch((e) => {
			// ignore play promise rejection (autoplay policy)
			console.debug('Audio play failed', e?.message || e);
		});
	} catch (err) {
		console.error('playProductAddedSound error', err);
	}
}

export default playProductAddedSound;
