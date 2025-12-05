
import './App.css'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import SyllabusSections from "./components/SyllabusSections.jsx";
import AssignedCourses from "./pages/AssignedCourses.jsx";
import Syllabus from "./pages/Syllabus.jsx";
import ReferenceForm from "./pages/ReferenceForm.jsx";
import TopicForm from "./pages/TopicForm.jsx";
import ILOForm from "./pages/ILOForm.jsx";
import AssignedTOS from "./pages/AssignedTOS.jsx";


function App() {

  return (
      <Router>
              <div className="appPage">
                  <Routes>
                      <Route path={'/'} element={<AssignedCourses />} />
                      <Route path={'/assignedtos'} element={<AssignedTOS />} />
                      <Route path={'/courses/:name'} element={<Syllabus />} />
                      <Route path={'/references/form/:id'} element={<ReferenceForm />} />
                      <Route path={'/topics/form/:id'} element={<TopicForm />} />
                      <Route path={'/ilos/form/:id'} element={<ILOForm />} />

                  </Routes>
              </div>
      </Router>

  )
}

export default App
