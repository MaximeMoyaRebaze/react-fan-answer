import './App.css'
import React, { useEffect, useRef, useState } from 'react';

const App: React.FC = () => {

  // TURN ICE SERVER CONFIG :
  const configurationIceServer = {
    iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  // BACKEND :
  const serverUrl = 'http://83.113.50.18:3000/'

  // REF :
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // STATES :
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);


  // INITIALIZE :
  useEffect(() => {
    const initializeMediaStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        await initializePeerConnection(stream);
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };
    initializeMediaStream();
  }, []);



  // INITIALIZE PEER CONNECTION WITH LOCAL STREAM :
  const initializePeerConnection = async (localStream: MediaStream) => {

    const roomId = '10'

    const response = await fetch(serverUrl + "save-room-with-offer/" + roomId, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': ''
      }
    });
    if (!response.ok) {
      throw new Error('Request failed');
    }
    const data = await response.json();
    console.log("Fetch get room with offer : ", data.data);


    const peerConnection = new RTCPeerConnection(configurationIceServer);
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        console.log("ADD_TRACK", track);
        peerConnection.addTrack(track, localStream);
      });
    }
    peerConnection.addEventListener('icecandidate', async (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        console.log("EVENT_ICE_CANDIDATE", event.candidate);
        try {
          const response = await fetch(serverUrl + "save-callee-candidates", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event.candidate),
          });
          if (!response.ok) {
            throw new Error('Request failed');
          }
          const data: RTCIceCandidate = await response.json();
          console.log("Fetch save callee candidates response : ", data);
        } catch (error) {
          console.error('An error occurred:', error);
          throw error;
        }
        // Send the ICE candidate to the remote peer
        // For simplicity, you can use a signaling server or a WebSocket to exchange ICE candidates
        // Example: socket.emit('candidate', event.candidate.toJSON());
      } else {
        console.log('ICE candidate gathering completed.');
      }
    });
    const remoteStream = new MediaStream();
    peerConnection.addEventListener('track', event => {
      console.log('Got remote track:', event.streams[0]);
      event.streams[0].getTracks().forEach(track => {
        console.log('Add a track to the remoteStream:', track);
        remoteStream.addTrack(track);
      });
    });
    if (remoteVideoRef.current) {
      console.log("REMOTE_VIDEO_REF", remoteVideoRef.current);
      remoteVideoRef.current.srcObject = remoteStream;
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.data.offer));

    const answer = await peerConnection.createAnswer();
    console.log('Created answer:', answer);
    await peerConnection.setLocalDescription(answer);
    const roomWithAnswer = {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    };

    const responseSaveAnswer = await fetch(serverUrl + "save-room-with-answer", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answer: roomWithAnswer.answer, id: "10" }),
    });
    if (!response.ok) {
      throw new Error('Request failed');
    }
    const dataAnswer: any = await responseSaveAnswer.json();

    console.log("Fetch save room with answer : ", dataAnswer);


    const responseCallerCandidate = await fetch("http://localhost:3000/get-caller-candidates");

    const jsonCallerCandidate = await responseCallerCandidate.json();




    jsonCallerCandidate.data.map(
      async caller => {
        console.log(`Got new remote ICE candidate: ${JSON.stringify(caller)}`);
        await peerConnection.addIceCandidate(new RTCIceCandidate(caller));
      })








  };



  return (
    <div>
      <div>
        <h1>FAN</h1>
        <h2>Local Video</h2>
        <video ref={localVideoRef} autoPlay playsInline muted />

      </div>
      {/* <div>
        <h2>Remote Video</h2>
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div> */}
      {/* <button onClick={handleStartBroadcast} disabled={!peerConnection}>
        Start Broadcast
      </button> */}
    </div>
  );
};

export default App;
