import faceapi from "@vladmandic/face-api/dist/face-api.node.js";
import canvas from "canvas";
import path from "path";

const { Canvas, Image, ImageData, loadImage } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

class FaceMatcher {
  constructor(photoA, photoB, detectTypeA, detectTypeB) {
    this.detectTypeA = "single";
    this.detectTypeB = "all";
    this.photoA = photoA;
    this.photoB = photoB;
    this.detectTypeA = detectTypeA;
    this.detectTypeB = detectTypeB;
  }

  async compare() {
    const [imageA, imageB] = await Promise.all([
      loadImage(this.photoA),
      loadImage(this.photoB),
    ]);

    await FaceMatcher.loadModels();

    const [resultA, resultB] = await Promise.all([
      this._detect(imageA, this.detectTypeA),
      this._detect(imageB, this.detectTypeB || this.detectTypeA),
    ]);

    const result = this._match(resultB, resultA);
    const { _label: label, distance } = result[0];

    return {
      label,
      similar: 100 - distance * 100,
      isMatching: distance < 0.5 ? true : false,
    };
  }
  _detect(image, detectType = "all") {
    if (detectType === "all")
      return faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors();
    if (detectType === "single")
      return faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
  }

  _match(compareThis, compareFrom) {
    const matcher = new faceapi.FaceMatcher(compareThis);
    return compareFrom.map((res) => matcher.findBestMatch(res.descriptor));
  }

  static async loadModels() {
    if (FaceMatcher.isModelLoaded) return;
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(FaceMatcher.modelspath),
      faceapi.nets.faceLandmark68Net.loadFromDisk(FaceMatcher.modelspath),
      faceapi.nets.faceRecognitionNet.loadFromDisk(FaceMatcher.modelspath),
    ]);
    FaceMatcher.isModelLoaded = true;
  }
}

FaceMatcher.modelspath = path.join(path.resolve(), "/models");
FaceMatcher.isModelLoaded = false;
FaceMatcher.SsdMobilenetv1Options = new faceapi.SsdMobilenetv1Options({
  minConfidence: 0.5,
});

export default FaceMatcher;
