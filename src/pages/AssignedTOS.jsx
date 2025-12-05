
import Skeleton from "../layouts/Skeleton.jsx";
import Header from "../components/Header.jsx";
import CoursesTable from "../components/CoursesTable.jsx";
import SideNavigation from "../components/SideNavigation.jsx";
import TOSCoursesTable from "../components/TOSCoursesTable.jsx";

const Syllabus = ({}) => {


    return (
        <Skeleton
            header={<Header role="Instructor" name="NORTON, MONICA"  />}
            content={<TOSCoursesTable />}
            nav={<SideNavigation/> }
        />
    )
}
export default Syllabus;

