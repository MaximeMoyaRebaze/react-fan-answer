import './App.css'
import React, { useEffect, useRef, useState } from 'react';
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
  // const serverUrl = 'http://83.113.50.18:3000/'
  const serverUrlSocket = 'http://83.113.50.18:3001/'

  // REF :
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // STATES :
  // const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  // const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  // const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);


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
      console.log("OK1111");
      await initializePeerConnection(peerConnection, stream, socket);
    };

    initializeMediaStream(peerConnection, socket);

  }, []);



  // INITIALIZE PEER CONNECTION WITH LOCAL STREAM :
  const initializePeerConnection = async (peerConnection: RTCPeerConnection, localStream: MediaStream, socket: Socket) => {

    // const roomId = '10'

    // const response = await fetch(serverUrl + "save-room-with-offer/" + roomId, {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Access-Control-Allow-Origin': ''
    //   }
    // });
    // if (!response.ok) {
    //   throw new Error('Request failed');
    // }
    // const data = await response.json();
    // console.log("Fetch get room with offer : ", data.data);


    console.log("OK22222");

    // const peerConnection = new RTCPeerConnection(configurationIceServer);

    socket.on('fan connected', async (data: any) => {

      console.log("SOCKET on send room with offer : ", data);

      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.room.offer));
      data.candidates.map(
        async caller => {
          console.log(`Got new remote ICE candidate: ${JSON.stringify(caller)}`);
          await peerConnection.addIceCandidate(new RTCIceCandidate(caller));
        })

      const answer = await peerConnection.createAnswer();
      console.log('Created answer:', answer);
      await peerConnection.setLocalDescription(answer);
      const roomWithAnswer = {
        answer: {
          type: answer.type,
          sdp: answer.sdp,
        },
      };

      socket.emit('save room with answer', { room: { answer: roomWithAnswer.answer }, id: '10' }, (response: any) => {
        console.log('Response from socket emit save room with answer : ', response);
      })

    })

    console.log("OK3333");


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

    // peerConnection.addEventListener('track', event => {
    //   console.log('Got remote track:', event.streams[0]);
    //   event.streams[0].getTracks().forEach(track => {
    //     console.log('Add a track to the remoteStream:', track);
    //     remoteStream.addTrack(track);
    //   });
    // });

    // await peerConnection.setRemoteDescription(new RTCSessionDescription(data.room.offer));

    // const answer = await peerConnection.createAnswer();
    // console.log('Created answer:', answer);
    // await peerConnection.setLocalDescription(answer);
    // const roomWithAnswer = {
    //   answer: {
    //     type: answer.type,
    //     sdp: answer.sdp,
    //   },
    // };

    // const responseSaveAnswer = await fetch(serverUrl + "save-room-with-answer", {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ answer: roomWithAnswer.answer, id: "10" }),
    // });
    // if (!responseSaveAnswer.ok) {
    //   throw new Error('Request failed');
    // }
    // const dataAnswer: any = await responseSaveAnswer.json();
    // console.log("Fetch save room with answer : ", dataAnswer);

    socket.emit("get caller candidates")
    socket.on("send caller candidates", () => {

    })

    // const responseCallerCandidate = await fetch("http://localhost:3000/get-caller-candidates");
    // const jsonCallerCandidate = await responseCallerCandidate.json();
    // jsonCallerCandidate.data.map(
    //   async caller => {
    //     console.log(`Got new remote ICE candidate: ${JSON.stringify(caller)}`);
    //     await peerConnection.addIceCandidate(new RTCIceCandidate(caller));
    //   })

    console.log("OK4444");

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
