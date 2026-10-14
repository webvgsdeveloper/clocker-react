// src/components/profile/EditProfileModal.jsx
import React, { useState, useRef } from "react";
import { motion, useDragControls } from "framer-motion";
import { useNotification } from "../../contexts/NotificationContext";
import {
  faCamera,
  faSave,
  faTimes,
  faUser,
  faAngleLeft,
  faTriangleExclamation,
  faCircleUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../common/Button";
import Input from "../common/Input";
import api from "../../services/api";
import { popIn } from "../common/animations";


const EditProfileModal = ({ user, onClose, onUpdate }) => {
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(
    api.getFileUrl(user?.profile_picture, user?.nombre),
  );
  const { addNotification } = useNotification();
  
  const constraintsRef = useRef(null);
  const dragControls = useDragControls();

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    setError("");

    if (!selectedFile) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Only images are allowed.");
      e.target.value = null;
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError("The image is too large. Maximum size allowed is 2MB.");
      e.target.value = null;
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim()) {
      setError("Full Name is required.");
      return;
    }

    const formData = new FormData();
    formData.append("nombre", nombre.trim());
    if (file) {
      formData.append("image", file);
    }

    onUpdate(formData);
    addNotification(
      "Clocker IA",
      "Done! I've already updated your profile.",
      "ai",
      true,
      true,
    );
  };

  return (
    <div 
      ref={constraintsRef}
      className="fixed inset-0 bg-vgsblack/50 backdrop-blur-sm flex items-center justify-center z-100 p-4 overflow-hidden"
    >
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        dragMomentum={false}
        variants={popIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        
        className="bg-vgswhite rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div 
          onPointerDown={(e) => dragControls.start(e)}
          className="bg-vgsred p-4 flex justify-between items-center text-vgswhite cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-2 text-lg">
            <FontAwesomeIcon icon={faCircleUser}/>
            <h3 className="font-bold">Edit Profile</h3>
          </div>
          <Button
            onClick={onClose}
            variant="none"
            className="w-5 h-5 p-0"
            icon={faTimes}
          />
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-3 border-dashed border-vgsgray bg-vgsgray/20 flex items-center justify-center">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={faUser}
                    className="text-vgsgray/70 text-5xl"
                  />
                )}
              </div>
              <label className="absolute bottom-1 right-1 bg-vgsdarkblue text-vgswhite w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-vgsred transition-transform hover:scale-110">
                <FontAwesomeIcon icon={faCamera} />
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            <p className="text-xs text-vgsblack mt-3 font-medium italic">
              Max. 2MB
            </p>
          </div>



          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Full Name
            </label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          {error && (
            <div className="bg-vgsred/10 border border-vgsred p-3 flex items-center justify-center gap-3 animate-head-shake">
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                className="text-vgsred"
              />
              <p className="text-xs text-vgsred font-bold">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="gray"
              onClick={onClose}
              icon={faAngleLeft}
              animation="translate"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="blue"
              className="flex-1"
              icon={faSave}
              type="submit"
              animation="pop"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditProfileModal;