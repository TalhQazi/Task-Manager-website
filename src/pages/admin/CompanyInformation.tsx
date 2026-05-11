import React from "react";
import AssetLibrary from "./AssetLibrary";

export default function CompanyInformation() {
  return (
    <AssetLibrary 
      moduleName="company-information" 
      title="Company Information" 
      description="Upload, organize, preview, and download documents and notes." 
      hideHeaderCarousel={true} 
    />
  );
}
