import React, { useState } from "react";
import {
  writeBinaryFile,
  createDir,
  readBinaryFile,
  BaseDirectory,
} from "@tauri-apps/api/fs";
import { join, appDataDir, downloadDir } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/tauri";

const PixelateImage = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [pixelating, setPixelating] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [pixelatedImagePath, setPixelatedImagePath] = useState("");

  const fetchAndPixelateImage = async () => {
    setLoading(true);
    setPixelating(true);
    try {
      // Fetch the image from the API
      const response = await fetch(
        "<pixel-art-generator-api-url>"
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      const fileName = `image_${Date.now()}.png`;
      const directory = "images";

      // Create the directory if it doesn't exist
      await createDir(directory, {
        dir: BaseDirectory.Download,
        recursive: true,
      });

      // Get the full path to the directory
      const appDataDirPath = await downloadDir();
      const fullPath = await join(appDataDirPath, directory, fileName);

      console.log(fullPath);

      // Save the image to the user's computer using Tauri's fs API
      await writeBinaryFile(fullPath, buffer);

      // Update the state with the full path
      setImageUrl(URL.createObjectURL(blob));

      // Pixelate the image using the path
      const pixelatedFileName = `pixelated_${Date.now()}.png`;
      const pixelatedFullPath = await join(
        appDataDirPath,
        directory,
        pixelatedFileName
      );
      await invoke("greet", { name: fullPath, output: pixelatedFullPath });

      // Read the pixelated image
      const pixelatedBinaryData = await readBinaryFile(pixelatedFullPath);
      const pixelatedBlob = new Blob([pixelatedBinaryData]);
      const pixelatedImageUrl = URL.createObjectURL(pixelatedBlob);

      // Update the state with the pixelated image URL
      setPixelatedImagePath(pixelatedImageUrl);
    } catch (error) {
      console.error("Error fetching and pixelating image:", error);
    } finally {
      setLoading(false);
      setPixelating(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter prompt"
      />
      <button onClick={fetchAndPixelateImage} disabled={loading || pixelating}>
        {loading
          ? "Loading..."
          : pixelating
          ? "Pixelating..."
          : "Fetch and Pixelate Image"}
      </button>
      {/* {imageUrl && (
        <div>
          <h3>Fetched Image:</h3>
          <img src={imageUrl} alt="Fetched from server" />
        </div>
      )} */}
      {pixelatedImagePath && (
        <div>
          <h3>Pixelated Image:</h3>
          <img
            src={pixelatedImagePath}
            alt="Pixelated image fetched from server"
          />
        </div>
      )}
    </div>
  );
};

export default PixelateImage;
