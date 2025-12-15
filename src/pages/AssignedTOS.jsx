
import SkeletonA from "../layouts/SkeletonA.jsx";
import HeaderA from "../components/HeaderA.jsx";
import CoursesTable from "../components/CoursesTable.jsx";
import SideNavigation from "../components/SideNavigation.jsx";
import TOSCoursesTable from "../components/TOSCoursesTable.jsx";

const Syllabus = ({}) => {


    return (
        <SkeletonA
            header={<HeaderA role="Instructor" name="NORTON, MONICA"  />}
            content={<TOSCoursesTable />}
            nav={<SideNavigation/> }
        />
    )
}
export default Syllabus;

