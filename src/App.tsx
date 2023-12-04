import './App.css'
import React, { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client'

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
  const serverUrlSocket = 'http://83.113.50.18:3001/'

  // REF :
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // INITIALIZE :
  useEffect(() => {
    const peerConnection = new RTCPeerConnection(configurationIceServer);

    const socket = io(serverUrlSocket);
    socket.on('connect', () => {
      console.log('SOCKET CONNECTED');
    });

    const initializeMediaStream = async (peerConnection: RTCPeerConnection, socket: Socket) => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      await initializePeerConnection(peerConnection, stream, socket);
    };

    initializeMediaStream(peerConnection, socket);

  }, []);

  // INITIALIZE PEER CONNECTION WITH LOCAL STREAM :
  const initializePeerConnection = async (peerConnection: RTCPeerConnection, localStream: MediaStream, socket: Socket) => {

    socket.on('fan connected', async (data: { room: { offer: RTCSessionDescription }, candidates: RTCIceCandidate[] }) => {

      console.log("SOCKET on(fan connected) : ", data);

      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.room.offer));
      data.candidates.map(
        async caller => {
          console.log(`Got new remote ICE candidate: ${JSON.stringify(caller)}`);
          await peerConnection.addIceCandidate(new RTCIceCandidate(caller));
        })

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      const roomWithAnswer = {
        answer: {
          type: answer.type,
          sdp: answer.sdp,
        },
      };
      socket.emit('save room with answer', { room: { answer: roomWithAnswer.answer }, id: 'uniqueID' })

    })

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        console.log("ADD_TRACK", track);
        peerConnection.addTrack(track, localStream);
      });
    }

    peerConnection.addEventListener('icecandidate', async (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        console.log("EVENT_ICE_CANDIDATE", event.candidate);

        // Send the ICE candidate to the remote peer
        // For simplicity, you can use a signaling server or a WebSocket to exchange ICE candidates
        // Example: socket.emit('candidate', event.candidate.toJSON());
        socket.emit('save callee candidate', { id: 'smartphone: 1', candidate: event.candidate })

        // try {
        //   const response = await fetch(serverUrl + "save-callee-candidates", {
        //     method: 'POST',
        //     headers: {
        //       'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(event.candidate),
        //   });
        //   if (!response.ok) {
        //     throw new Error('Request failed');
        //   }
        //   const data: RTCIceCandidate = await response.json();
        //   console.log("Fetch save callee candidates response : ", data);
        // } catch (error) {
        //   console.error('An error occurred:', error);
        //   throw error;
        // }

      } else {
        console.log('ICE candidate gathering completed.');
      }

    });

    const remoteStream = new MediaStream();

    if (remoteVideoRef.current) {
      console.log("REMOTE_VIDEO_REF", remoteVideoRef.current);
      remoteVideoRef.current.srcObject = remoteStream;
    }

  };

  return (
    <div>
      <div>
        <h1>FAN</h1>
        <h2>Local Video</h2>
        <video ref={localVideoRef} autoPlay playsInline muted />
      </div>
    </div>
  );
};

export default App;
