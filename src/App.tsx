import './App.css'

import React, { useEffect, useRef } from 'react';

import * as Implementations from './Implementations'

export const App: React.FC = () => {

  // const serverUrlSocket = 'http://localhost:3001/fan'
  const serverUrlSocket = 'https://back-end-fan-cam-e765fca54737.herokuapp.com/fan'

  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {

    // todo: check if the browser supports the WebRTC 

    const initializeMediaStream = async () => {

      const localStream = await Implementations.createLocalStream(localVideoRef)

      const socket = Implementations.createSocketConnection(serverUrlSocket)



      Implementations.createPeerConnection(localStream, socket)

    };

    initializeMediaStream();

  }, []);

  return (
    <div>
      <div>
        <h1>FAN</h1>
        <video ref={localVideoRef} autoPlay playsInline muted />
      </div>
    </div>
  );
};
