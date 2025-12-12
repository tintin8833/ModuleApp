
import Skeleton from "../layouts/Skeleton.jsx";
import Header from "../components/Header.jsx";
import SideNavigation from "../components/SideNavigation.jsx";

const Dean = () => {
  return (
    <Skeleton
      header={<Header role="Dean" name="NORTON, MONICA" />}
      nav={<SideNavigation />}
      content={
        <div style={{ padding: 20 }}>
          <h2>Dean</h2>
          <p>You are viewing the Dean page.</p>
        </div>
      }
    />
  );
};

export default Dean;
