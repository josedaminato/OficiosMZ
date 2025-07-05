import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { supabase } from "../supabaseClient";

const oficioOptions = [
  "Albañil",
  "Plomero",
  "Electricista",
  "Carpintero",
  "Limpieza",
  "Herrero",
  "Pintor",
  "Otra",
];

// Esquema de validación
const schema = yup.object().shape({
  profile_picture: yup.mixed().required("La foto de perfil es obligatoria"),
  live_capture: yup.mixed().required("La captura en vivo es obligatoria"),
  oficio: yup.string().required("El oficio es obligatorio"),
  custom_oficio: yup.string().when("oficio", {
    is: "Otra",
    then: yup.string().required("Debes especificar el oficio"),
    otherwise: yup.string(),
  }),
  experience: yup.string(),
  specialty: yup.string().required("La especialidad es obligatoria"),
  dni_front: yup.mixed(),
  dni_back: yup.mixed(),
  skills: yup.string().required("Las habilidades son obligatorias"),
  certifications: yup.string(),
  work_zones: yup.string().required("Las zonas de trabajo son obligatorias"),
  phone: yup.string().required("El teléfono es obligatorio"),
  email: yup.string().email("Email inválido").required("El email es obligatorio"),
});

export default function RegisterWorkerForm({ userId }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [liveCaptureUrl, setLiveCaptureUrl] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  // Función para subir un archivo a Supabase Storage
  const uploadFile = async (bucket, file, path) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return publicUrlData.publicUrl;
  };

  // Captura en vivo (simulada, solo toma foto de la cámara)
  const handleStartCamera = async () => {
    setShowCamera(true);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 240, 180);
      canvasRef.current.toBlob((blob) => {
        setLiveCaptureUrl(URL.createObjectURL(blob));
      }, "image/jpeg");
    }
    // Detener la cámara
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setShowCamera(false);
  };

  const oficio = watch("oficio");

  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitError("");
    setSuccess(false);
    setUploadProgress(0);

    try {
      // Subir imágenes
      const avatarFile = data.profile_picture[0];
      if (!avatarFile) {
        setError("profile_picture", { message: "La foto de perfil es obligatoria" });
        setLoading(false);
        return;
      }
      const avatarPath = `${userId}/${Date.now()}_${avatarFile.name}`;
      setUploadProgress(10);
      const avatarUrl = await uploadFile("avatars", avatarFile, avatarPath);

      // Subir captura en vivo (simulada)
      let liveCaptureUrlFinal = null;
      if (liveCaptureUrl) {
        const response = await fetch(liveCaptureUrl);
        const blob = await response.blob();
        const liveCapturePath = `${userId}/live_capture_${Date.now()}.jpg`;
        setUploadProgress(20);
        liveCaptureUrlFinal = await uploadFile("avatars", blob, liveCapturePath);
      } else {
        setError("live_capture", { message: "La captura en vivo es obligatoria" });
        setLoading(false);
        return;
      }

      let dniFrontUrl = null;
      let dniBackUrl = null;
      if (data.dni_front && data.dni_front[0]) {
        const dniFrontPath = `${userId}/dni_front_${Date.now()}_${data.dni_front[0].name}`;
        setUploadProgress(30);
        dniFrontUrl = await uploadFile("documents", data.dni_front[0], dniFrontPath);
      }
      if (data.dni_back && data.dni_back[0]) {
        const dniBackPath = `${userId}/dni_back_${Date.now()}_${data.dni_back[0].name}`;
        setUploadProgress(40);
        dniBackUrl = await uploadFile("documents", data.dni_back[0], dniBackPath);
      }

      setUploadProgress(60);

      // Preparar datos para la tabla worker_profiles
      const profileData = {
        id: userId,
        avatar_url: avatarUrl,
        live_capture_url: liveCaptureUrlFinal,
        dni_front_url: dniFrontUrl,
        dni_back_url: dniBackUrl,
        oficio: data.oficio === "Otra" ? data.custom_oficio : data.oficio,
        experience: data.experience,
        specialty: data.specialty,
        skills: data.skills.split(",").map((s) => s.trim()),
        certifications: data.certifications ? data.certifications.split(",").map((c) => c.trim()) : [],
        work_zones: data.work_zones.split(",").map((z) => z.trim()),
        phone: data.phone,
        email: data.email,
        created_at: new Date(),
      };

      // Insertar en la tabla worker_profiles
      const { error: insertError } = await supabase
        .from("worker_profiles")
        .insert([profileData]);

      if (insertError) throw insertError;

      setUploadProgress(100);
      setSuccess(true);
      reset();
      setLiveCaptureUrl(null);
    } catch (err) {
      setSubmitError(err.message || "Error al registrar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="max-w-lg mx-auto p-6 bg-white rounded shadow flex flex-col gap-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <h2 className="text-2xl font-bold mb-2">Registro de Trabajador</h2>

      {/* Foto de perfil */}
      <label className="font-semibold">Foto de perfil *</label>
      <input type="file" accept="image/*" {...register("profile_picture")} />
      {errors.profile_picture && (
        <span className="text-red-500">{errors.profile_picture.message}</span>
      )}

      {/* Captura en vivo con cámara */}
      <label className="font-semibold">Captura en vivo con cámara *</label>
      {!liveCaptureUrl && !showCamera && (
        <button type="button" className="bg-blue-600 text-white px-3 py-1 rounded mb-2" onClick={handleStartCamera}>
          Iniciar cámara
        </button>
      )}
      {showCamera && (
        <div className="flex flex-col items-center mb-2">
          <video ref={videoRef} width={240} height={180} autoPlay className="mb-2 rounded border" />
          <button type="button" className="bg-green-600 text-white px-3 py-1 rounded" onClick={handleCapture}>
            Capturar foto
          </button>
          <canvas ref={canvasRef} width={240} height={180} style={{ display: "none" }} />
        </div>
      )}
      {liveCaptureUrl && (
        <div className="flex flex-col items-center mb-2">
          <img src={liveCaptureUrl} alt="Captura en vivo" className="w-32 h-24 object-cover rounded border" />
          <button type="button" className="text-blue-600 underline mt-1" onClick={() => setLiveCaptureUrl(null)}>
            Volver a capturar
          </button>
        </div>
      )}
      {errors.live_capture && (
        <span className="text-red-500">{errors.live_capture.message}</span>
      )}

      {/* Oficio */}
      <label className="font-semibold">Oficio *</label>
      <select {...register("oficio")}
        className="border rounded p-2">
        <option value="">Selecciona un oficio</option>
        {oficioOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {oficio === "Otra" && (
        <input
          {...register("custom_oficio")}
          className="border rounded p-2 mt-2"
          type="text"
          placeholder="Especificar oficio"
        />
      )}
      {errors.oficio && (
        <span className="text-red-500">{errors.oficio.message}</span>
      )}
      {errors.custom_oficio && (
        <span className="text-red-500">{errors.custom_oficio.message}</span>
      )}

      {/* Especialidad */}
      <label className="font-semibold">Especialidad *</label>
      <input {...register("specialty")}
        className="border rounded p-2"
        placeholder="Ej: techos, construcción en seco, instalaciones eléctricas..." />
      {errors.specialty && (
        <span className="text-red-500">{errors.specialty.message}</span>
      )}

      {/* Años de experiencia */}
      <label className="font-semibold">Años de experiencia (opcional)</label>
      <input {...register("experience")}
        className="border rounded p-2"
        type="number"
        min="0"
        placeholder="Ej: 5" />

      {/* DNI frente */}
      <label className="font-semibold">DNI Frente (opcional)</label>
      <input type="file" accept="image/*" {...register("dni_front")} />

      {/* DNI dorso */}
      <label className="font-semibold">DNI Dorso (opcional)</label>
      <input type="file" accept="image/*" {...register("dni_back")} />

      {/* Habilidades */}
      <label className="font-semibold">Habilidades (separadas por coma) *</label>
      <input {...register("skills")}
        className="border rounded p-2"
        placeholder="Ej: plomería, electricidad, pintura..." />
      {errors.skills && (
        <span className="text-red-500">{errors.skills.message}</span>
      )}

      {/* Certificaciones */}
      <label className="font-semibold">Certificaciones (separadas por coma)</label>
      <input {...register("certifications")}
        className="border rounded p-2"
        placeholder="Ej: matriculado, cursos, etc." />

      {/* Zonas de trabajo */}
      <label className="font-semibold">Zonas de trabajo (separadas por coma) *</label>
      <input {...register("work_zones")}
        className="border rounded p-2"
        placeholder="Ej: Godoy Cruz, Maipú, Luján..." />
      {errors.work_zones && (
        <span className="text-red-500">{errors.work_zones.message}</span>
      )}

      {/* Teléfono */}
      <label className="font-semibold">Teléfono de contacto *</label>
      <input {...register("phone")}
        className="border rounded p-2"
        placeholder="Ej: 261-1234567" />
      {errors.phone && (
        <span className="text-red-500">{errors.phone.message}</span>
      )}

      {/* Email */}
      <label className="font-semibold">Email *</label>
      <input {...register("email")}
        className="border rounded p-2"
        placeholder="Ej: correo@ejemplo.com" />
      {errors.email && (
        <span className="text-red-500">{errors.email.message}</span>
      )}

      {/* Progreso de subida */}
      {loading && (
        <div className="w-full bg-gray-200 rounded h-2 my-2">
          <div
            className="bg-blue-500 h-2 rounded"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {/* Mensajes de error o éxito */}
      {submitError && <div className="text-red-600">{submitError}</div>}
      {success && (
        <div className="text-green-600">¡Perfil registrado exitosamente!</div>
      )}

      <button
        type="submit"
        className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Registrando..." : "Registrar"}
      </button>
    </form>
  );
} 