import './App.css'

import React, { useEffect, useRef } from 'react';

import * as Implementations from './Implementations'

export const App: React.FC = () => {

  //const serverUrlSocket = 'http://localhost:3001/fan'
  const serverUrlSocket = 'http://83.113.50.18:3001/fan'

  const localVideoRef = useRef<HTMLVideoElement>(null);



  useEffect(() => {



    //check if the browser supports the WebRTC 



    const initializeMediaStream = async () => {

      const localStream = await Implementations.createLocalStream(localVideoRef)

      const socket = Implementations.createSocketConnection(serverUrlSocket)

      const cellphoneId = Implementations.createCellphoneUUID()

      Implementations.createPeerConnection(localStream, socket, cellphoneId)

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
