
import Skeleton from "../layouts/Skeleton.jsx";
import Header from "../components/Header.jsx";
import CoursesTable from "../components/CoursesTable.jsx";

const Syllabus = ({}) => {
    return (
        <Skeleton
            header={<Header role="Instructor" name="NORTON, MONICA"  />}
            content={ <CoursesTable /> }
        />
    )
}
export default Syllabus;