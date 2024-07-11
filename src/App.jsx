import { useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";

const Object = () => {
  const [model, setModel] = useState(null);
  const [maxPredictions, setMaxPredictions] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [highestPrediction, setHighestPrediction] = useState("");
  const webcamRef = useRef(null);
  const labelContainerRef = useRef(null);

  const loadModel = async () => {
    const modelURL = "/model.json";
    const metadataURL = "/metadata.json";

    try {
      const loadedModel = await tmImage.load(modelURL, metadataURL);
      setModel(loadedModel);
      setMaxPredictions(loadedModel.getTotalClasses());
      console.log("Model loaded successfully");
    } catch (error) {
      console.error("Error loading model: ", error);
    }
  };

  useEffect(() => {
    loadModel();
  }, []);

  const setupWebcam = async () => {
    const flip = true;
    const webcam = new tmImage.Webcam(640, 480, flip);
    await webcam.setup();
    await webcam.play();
    webcamRef.current = webcam;
    requestAnimationFrame(loop);

    document.getElementById("webcam-container").appendChild(webcam.canvas);

    for (let i = 0; i < maxPredictions; i++) {
      labelContainerRef.current.appendChild(document.createElement("div"));
    }
    setIsCameraOn(true);
  };

  const loop = async () => {
    if (webcamRef.current) {
      webcamRef.current.update();
      await predict();
      requestAnimationFrame(loop);
    }
  };

  const predict = async () => {
    if (model && webcamRef.current) {
      const prediction = await model.predict(webcamRef.current.canvas);
      setPredictions(prediction);
      const highestPrediction = prediction.reduce((prev, current) =>
        prev.probability > current.probability ? prev : current
      );
      setHighestPrediction(highestPrediction.className);
    }
  };

  const handleStart = async () => {
    if (!isCameraOn) {
      await setupWebcam();
    }
  };

  return (
    <>
      <button
        type="button"
        className={
          "bg-green-500 text-xl p-5 text-white font-bold rounded-lg mb-4"
        }
        onClick={handleStart}
      >
        {!isCameraOn ? "Start" : "Stop"}
      </button>

      <div className="hidden">
        <div className="mx-auto">
          <div id="label-container" ref={labelContainerRef}>
            {predictions.map((prediction, index) => (
              <div key={index}>
                {prediction.className}:{""}
                {prediction.probability.toFixed(2) * 100}%
                <div
                  className="progress"
                  role="progressbar"
                  aria-valuenow="100"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {prediction.probability.toFixed(2) * 100 <= 80
                    ? "tidak terdeteksi"
                    : "terdeteksi"}
                  <div
                    className="progress-bar"
                    style={{
                      width: prediction.probability.toFixed(2) * 100 + "%",
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="webcam-container"></div>
    </>
  );
};

export default Object;
