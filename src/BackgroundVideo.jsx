export default function BackgroundVideo() {
  return (
    <video
      className="fixed top-0 left-0 w-full h-full object-cover -z-20 blur-sm brightness-75"
      autoPlay
      muted
      loop
      playsInline
    >
      <source src="/videos/background.mp4" type="video/mp4" />
    </video>
  );
}
