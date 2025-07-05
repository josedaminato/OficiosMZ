import React, { useRef, useState } from 'react';

interface FaceVerificationProps {
  userId: string;
  onVerified: () => void;
}

const FaceVerification: React.FC<FaceVerificationProps> = ({ userId, onVerified }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Iniciar la cámara
  const startCamera = async () => {
    setResult(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    }
  };

  // Capturar la imagen y enviarla al backend
  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    context.drawImage(videoRef.current, 0, 0, 320, 240);
    // Convertir el canvas a blob para enviar como archivo
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      setLoading(true);
      setResult(null);
      try {
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('image', blob, 'captured.jpg');
        const response = await fetch('http://localhost:8000/api/verify-face', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.verified) {
          setResult('¡Verificación exitosa!');
          onVerified();
        } else {
          setResult('Las imágenes no coinciden, no puedes postularte.');
        }
      } catch (error) {
        setResult('Error al verificar la imagen.');
      } finally {
        setLoading(false);
      }
    }, 'image/jpeg');
  };

  // Detener la cámara
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setStreaming(false);
    }
  };

  return (
    <div className="face-verification">
      <h2>Verificación facial</h2>
      {!streaming ? (
        <button onClick={startCamera}>Iniciar cámara</button>
      ) : (
        <>
          <video ref={videoRef} width={320} height={240} autoPlay />
          <canvas ref={canvasRef} width={320} height={240} style={{ display: 'none' }} />
          <div>
            <button onClick={captureAndVerify} disabled={loading}>Capturar y verificar</button>
            <button onClick={stopCamera}>Detener cámara</button>
          </div>
        </>
      )}
      {loading && <p>Verificando...</p>}
      {result && <p>{result}</p>}
    </div>
  );
};

export default FaceVerification; 