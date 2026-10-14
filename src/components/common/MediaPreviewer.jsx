// src/components/common/MediaPreviewer.jsx
import React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  faTimes,
  faDownload,
  faGripLines,
} from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";
import Badge from "./Badge";
import Image from "./Image";

const MediaPreviewer = ({ isOpen, onClose, fileUrl, fileType, fileName }) => {
  const dragControls = useDragControls();
  const handleDownloadAndOpen = () => {
    if (fileUrl) {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
  };
  const startDrag = (event) => {
    dragControls.start(event);
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 pointer-events-none">
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="pointer-events-auto absolute top-20 left-20 w-150 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-100 max-h-screen"
          >
            <div 
              onPointerDown={startDrag}
              className="handle-drag bg-vgsdarkblue/90 text-vgswhite p-3 cursor-move flex justify-between items-center select-none"
            >
              <div className="flex items-center gap-3">
                <Badge icon={faGripLines} variant="none" />
                <span className="text-xs font-bold truncate max-w-75">
                  {fileName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="transparent"
                  icon={faDownload}
                  onClick={handleDownloadAndOpen}
                  className="p-1! text-vgswhite hover:bg-white/20"
                  tittle="Download/Open in new tab"
                />
                <Button
                  onClick={onClose}
                  variant="red"
                  icon={faTimes}
                  className="p-1! px-2!"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50/50 p-0 flex items-center justify-center">
              {fileType?.startsWith("image/") && (
                <Image src={fileUrl} alt={fileName} />
              )}

              {fileType?.startsWith("video/") && (
                <video controls autoPlay className="w-full rounded shadow-sm">
                  <source src={fileUrl} type={fileType} />
                  Your browser does not support the video tag.
                </video>
              )}

              {fileType?.includes("pdf") && (
                <iframe
                  src={fileUrl}
                  className="w-full h-125 rounded border bg-white"
                  title={fileName}
                />
              )}

              {!fileType?.startsWith("image/") &&
                !fileType?.startsWith("video/") &&
                !fileType?.includes("pdf") && (
                  <div className="text-center p-10 bg-white rounded-xl shadow-inner border border-dashed border-vgsgray/30">
                    <p className="text-sm text-vgsgray mb-4 font-medium">
                      No preview available for this file type
                    </p>
                    <Button
                      variant="blue"
                      onClick={handleDownloadAndOpen}
                      icon={faDownload}
                      className="text-xs px-8"
                    >
                      Download / Open File
                    </Button>
                  </div>
                )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MediaPreviewer;
