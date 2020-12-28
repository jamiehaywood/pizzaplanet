import React, { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import { GetPingResponse } from "@mono/interfaces";

function App() {
  const [apiResponse, setApiResponse] = useState<string>();
  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get<GetPingResponse>("/api/ping");
        setApiResponse(response.data.data);
      } catch {
        setApiResponse("There was an error... :(");
      }
    })();
  });
  return (
    <div className="App">
      <h2>Call to API:</h2>
      <code>/api/ping</code>

      <h2>Response from API:</h2>
      <code>{apiResponse}</code>
    </div>
  );
}

export default App;
