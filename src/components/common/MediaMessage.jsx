// src/components/common/MediaMessage.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAlt,
  faExpand,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../services/api";
import Image from "./Image";
import Button from "./Button";

const MediaMessage = ({ fileUrl, fileType, fileName, onPreview }) => {
  const fullUrl = api.getFileUrl(fileUrl);

  const handlePreview = (e) => {
    e.preventDefault();
    onPreview({ url: fullUrl, type: fileType, name: fileName });
  };

  if (fileType?.startsWith("image/")) {
    return (
      <div className="rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity shadow-sm border border-black/5">
        <Image
          src={fullUrl}
          alt={fileName}
          className="max-w-full max-h-60 object-cover"
          onClick={handlePreview}
        />
      </div>
    );
  }

  if (fileType?.startsWith("video/")) {
    return (
      <div className="rounded-lg overflow-hidden bg-black max-w-full cursor-pointer relative group">
        <video className="max-h-60 w-full" onClick={handlePreview}>
          <source src={fullUrl} type={fileType} />
        </video>
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all"
          onClick={handlePreview}
        >
          <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-full backdrop-blur-sm">
            <FontAwesomeIcon icon={faExpand} className="text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={handlePreview}
      className="text-vgswhite max-w-full"
      icon={faFileAlt}
      iconClassName="text-xl"
    >
      <div className="flex-1 min-w-0 text-left">
        <p className="truncate text-sm font-medium">{fileName}</p>
        <p className="text-xs text-vgswhite/70">Click to preview</p>
      </div>
    </Button>
  );
};

export default MediaMessage;
