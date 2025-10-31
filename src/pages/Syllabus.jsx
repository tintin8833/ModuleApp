
import Skeleton from "../layouts/Skeleton.jsx";
import Header from "../components/Header.jsx";
import SyllabusSections from "../components/SyllabusSections.jsx";

const Syllabus = ({}) => {
    return (
        <Skeleton
            header={<Header role="Instructor" name="NORTON, MONICA"  />}
            content={<SyllabusSections />}
        />
    )
}
export default Syllabus;