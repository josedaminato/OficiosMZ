import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useSupabase";
import { uploadFile } from "../utils/uploadFile";

// Componentes reutilizables
import { TextInput, FileUpload, CameraCapture, Select, LoadingSpinner } from "./ui";

const oficioOptions = [
  { value: "Albañil", label: "Albañil" },
  { value: "Plomero", label: "Plomero" },
  { value: "Electricista", label: "Electricista" },
  { value: "Carpintero", label: "Carpintero" },
  { value: "Limpieza", label: "Limpieza" },
  { value: "Herrero", label: "Herrero" },
  { value: "Pintor", label: "Pintor" },
  { value: "Otra", label: "Otra" },
];

export default function RegisterWorkerForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    oficio: '',
    custom_oficio: '',
    experience: '',
    specialty: '',
    skills: '',
    certifications: '',
    work_zones: '',
    phone: '',
    email: ''
  });
  
  const [files, setFiles] = useState({
    profile_picture: null,
    live_capture: null,
    dni_front: null,
    dni_back: null
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Validación del formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!files.profile_picture) {
      newErrors.profile_picture = 'La foto de perfil es obligatoria';
    }
    
    if (!files.live_capture) {
      newErrors.live_capture = 'La captura en vivo es obligatoria';
    }
    
    if (!formData.oficio) {
      newErrors.oficio = 'El oficio es obligatorio';
    }
    
    if (formData.oficio === 'Otra' && !formData.custom_oficio) {
      newErrors.custom_oficio = 'Debes especificar el oficio';
    }
    
    if (!formData.specialty) {
      newErrors.specialty = 'La especialidad es obligatoria';
    }
    
    if (!formData.skills) {
      newErrors.skills = 'Las habilidades son obligatorias';
    }
    
    if (!formData.work_zones) {
      newErrors.work_zones = 'Las zonas de trabajo son obligatorias';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'El teléfono es obligatorio';
    }
    
    if (!formData.email) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleFileChange = (fieldName, files) => {
    setFiles(prev => ({
      ...prev,
      [fieldName]: files
    }));
    
    // Limpiar error del campo
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };

  const handleCameraCapture = (files) => {
    handleFileChange('live_capture', files);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    if (!user) {
      toast.error('Debes estar autenticado para registrar tu perfil');
      navigate('/login');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Mostrar toast de inicio
      const progressToast = toast.info("Iniciando registro...", {
        autoClose: false,
        closeButton: false,
      });

      // Subir foto de perfil
      const avatarFile = files.profile_picture[0];
      setUploadProgress(10);
      toast.update(progressToast, {
        render: "Subiendo foto de perfil...",
        type: "info",
      });

      const avatarPath = `${user.id}/${Date.now()}_${avatarFile.name}`;
      const avatarUrl = await uploadFile("avatars", avatarFile, avatarPath);

      // Subir captura en vivo
      setUploadProgress(30);
      toast.update(progressToast, {
        render: "Procesando captura en vivo...",
        type: "info",
      });

      const liveCaptureFile = files.live_capture[0];
      const liveCapturePath = `${user.id}/live_capture_${Date.now()}.jpg`;
      const liveCaptureUrl = await uploadFile("avatars", liveCaptureFile, liveCapturePath);

      // Subir documentos DNI (opcionales)
      setUploadProgress(50);
      toast.update(progressToast, {
        render: "Subiendo documentos...",
        type: "info",
      });

      let dniFrontUrl = null;
      let dniBackUrl = null;

      if (files.dni_front && files.dni_front[0]) {
        const dniFrontPath = `${user.id}/dni_front_${Date.now()}_${files.dni_front[0].name}`;
        dniFrontUrl = await uploadFile("documents", files.dni_front[0], dniFrontPath);
      }

      if (files.dni_back && files.dni_back[0]) {
        const dniBackPath = `${user.id}/dni_back_${Date.now()}_${files.dni_back[0].name}`;
        dniBackUrl = await uploadFile("documents", files.dni_back[0], dniBackPath);
      }

      setUploadProgress(70);
      toast.update(progressToast, {
        render: "Guardando perfil...",
        type: "info",
      });

      // Preparar datos para la tabla worker_profiles
      const profileData = {
        id: user.id,
        avatar_url: avatarUrl,
        live_capture_url: liveCaptureUrl,
        dni_front_url: dniFrontUrl,
        dni_back_url: dniBackUrl,
        oficio: formData.oficio === "Otra" ? formData.custom_oficio : formData.oficio,
        experience: formData.experience,
        specialty: formData.specialty,
        skills: formData.skills.split(",").map((s) => s.trim()),
        certifications: formData.certifications ? formData.certifications.split(",").map((c) => c.trim()) : [],
        work_zones: formData.work_zones.split(",").map((z) => z.trim()),
        phone: formData.phone,
        email: formData.email,
        created_at: new Date(),
      };

      // Insertar en la tabla worker_profiles
      const { error: insertError } = await uploadFile.supabase
        .from("worker_profiles")
        .insert([profileData]);

      if (insertError) throw insertError;

      setUploadProgress(100);
      
      // Cerrar toast de progreso y mostrar éxito
      toast.dismiss(progressToast);
      toast.success("¡Perfil registrado exitosamente!", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Redirigir al dashboard
      navigate('/dashboard');

    } catch (err) {
      console.error("Error al registrar perfil:", err);
      
      toast.error(
        err.message || "Error al registrar el perfil. Inténtalo de nuevo.",
        {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <form
          className="bg-white rounded-lg shadow-lg p-6"
          onSubmit={onSubmit}
        >
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Registro de Trabajador
            </h2>
            <p className="text-gray-600">
              Completa tu perfil para comenzar a recibir solicitudes de trabajo
            </p>
            <p className="mt-2 text-sm text-gray-500">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna izquierda */}
            <div className="space-y-6">
              {/* Foto de perfil */}
              <FileUpload
                label="Foto de perfil"
                name="profile_picture"
                accept="image/*"
                onChange={(files) => handleFileChange('profile_picture', files)}
                required={true}
                disabled={loading}
                error={errors.profile_picture}
              />

              {/* Captura en vivo */}
              <CameraCapture
                label="Captura en vivo con cámara"
                onCapture={handleCameraCapture}
                disabled={loading}
                error={errors.live_capture}
              />

              {/* Oficio */}
              <Select
                label="Oficio"
                name="oficio"
                value={formData.oficio}
                onChange={handleInputChange}
                options={oficioOptions}
                required={true}
                disabled={loading}
                error={errors.oficio}
              />

              {/* Oficio personalizado */}
              {formData.oficio === "Otra" && (
                <TextInput
                  label="Especificar oficio"
                  name="custom_oficio"
                  type="text"
                  value={formData.custom_oficio}
                  onChange={handleInputChange}
                  required={true}
                  disabled={loading}
                  placeholder="Describe tu oficio"
                  error={errors.custom_oficio}
                />
              )}

              {/* Especialidad */}
              <TextInput
                label="Especialidad"
                name="specialty"
                type="text"
                value={formData.specialty}
                onChange={handleInputChange}
                required={true}
                disabled={loading}
                placeholder="Ej: techos, construcción en seco, instalaciones eléctricas..."
                error={errors.specialty}
              />

              {/* Años de experiencia */}
              <TextInput
                label="Años de experiencia"
                name="experience"
                type="number"
                value={formData.experience}
                onChange={handleInputChange}
                required={false}
                disabled={loading}
                placeholder="Ej: 5"
                min="0"
                error={errors.experience}
              />
            </div>

            {/* Columna derecha */}
            <div className="space-y-6">
              {/* DNI Frente */}
              <FileUpload
                label="DNI Frente (opcional)"
                name="dni_front"
                accept="image/*"
                onChange={(files) => handleFileChange('dni_front', files)}
                required={false}
                disabled={loading}
                error={errors.dni_front}
              />

              {/* DNI Dorso */}
              <FileUpload
                label="DNI Dorso (opcional)"
                name="dni_back"
                accept="image/*"
                onChange={(files) => handleFileChange('dni_back', files)}
                required={false}
                disabled={loading}
                error={errors.dni_back}
              />

              {/* Habilidades */}
              <TextInput
                label="Habilidades (separadas por coma)"
                name="skills"
                type="text"
                value={formData.skills}
                onChange={handleInputChange}
                required={true}
                disabled={loading}
                placeholder="Ej: plomería, electricidad, pintura..."
                error={errors.skills}
              />

              {/* Certificaciones */}
              <TextInput
                label="Certificaciones (separadas por coma)"
                name="certifications"
                type="text"
                value={formData.certifications}
                onChange={handleInputChange}
                required={false}
                disabled={loading}
                placeholder="Ej: matriculado, cursos, etc."
                error={errors.certifications}
              />

              {/* Zonas de trabajo */}
              <TextInput
                label="Zonas de trabajo (separadas por coma)"
                name="work_zones"
                type="text"
                value={formData.work_zones}
                onChange={handleInputChange}
                required={true}
                disabled={loading}
                placeholder="Ej: Godoy Cruz, Maipú, Luján..."
                error={errors.work_zones}
              />

              {/* Teléfono */}
              <TextInput
                label="Teléfono de contacto"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                required={true}
                disabled={loading}
                placeholder="Ej: 261-1234567"
                error={errors.phone}
              />

              {/* Email */}
              <TextInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required={true}
                disabled={loading}
                placeholder="Ej: correo@ejemplo.com"
                error={errors.email}
              />
            </div>
          </div>

          {/* Barra de progreso */}
          {loading && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progreso de registro
                </span>
                <span className="text-sm text-gray-500">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Botón de envío */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-3 px-6 rounded-lg font-semibold text-white
                transition-all duration-200 flex items-center justify-center gap-2
                ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }
              `}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="white" text="Registrando perfil..." />
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Registrar Perfil
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 