
import './App.css'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import SyllabusSections from "./components/SyllabusSections.jsx";
import AssignedCourses from "./pages/AssignedCourses.jsx";
import Syllabus from "./pages/Syllabus.jsx";
import ReferenceForm from "./pages/ReferenceForm.jsx";
import TopicForm from "./pages/TopicForm.jsx";
import ILOForm from "./pages/ILOForm.jsx";
import ProgramHead from "./pages/ProgramHead.jsx";
import Dean from "./pages/Dean.jsx";
import HRStaff from "./pages/HRStaff.jsx";


function App() {

  return (
      <Router>
              <div className="appPage">
                  <Routes>
                      <Route path={'/'} element={<AssignedCourses />} />
                      <Route path={'/role/instructor'} element={<AssignedCourses />} />
                      <Route path={'/courses/:name'} element={<Syllabus />} />
                      <Route path={'/references/form/:id'} element={<ReferenceForm />} />
                      <Route path={'/topics/form/:id'} element={<TopicForm />} />
                      <Route path={'/ilos/form/:id'} element={<ILOForm />} />
                      {/* Role pages */}
                      <Route path={'/role/program-head'} element={<ProgramHead />} />
                      <Route path={'/role/dean'} element={<Dean />} />
                      <Route path={'/role/hr-staff'} element={<HRStaff />} />

                  </Routes>
              </div>
      </Router>

  )
}

export default App
