const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.json());

let tasks=[
    { id: 1, title: "Learn JSON", completed: false },
    { id: 2, title: "Learn APIs", completed: true }
];

app.get("/", (req, res) => {
    res.send("My task api is runnig!");
});

app.get("/api/tasks", (req, res)=>{
    res.json(tasks);
});

app.listen(PORT, ()=>{
    console.log(`server running at http://localhost:${PORT}`);
});
