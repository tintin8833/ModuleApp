import React from 'react';
import { useSearchParams } from 'react-router-dom';
import SkeletonA from "../layouts/SkeletonA.jsx";
import HeaderA from "../components/HeaderA.jsx";
import SideNavigation from "../components/SideNavigation.jsx";
import DeanFaculty from "./DeanFaculty.jsx";
import DeanPrograms from "./DeanPrograms.jsx";

const Dean = () => {
  const [searchParams] = useSearchParams();
  const page = searchParams.get('page') || 'Faculty';

  const renderContent = () => {
    switch (page) {
      case 'Programs':
        return <DeanPrograms key="programs" />;
      case 'Faculty':
      default:
        return <DeanFaculty key="faculty" />;
    }
  };

  return (
    <SkeletonA
      header={<HeaderA role="Dean" name="TRILLANES, AGNES" />}
      nav={<SideNavigation mode="dean" />}
      content={renderContent()}
    />
  );
};

export default Dean;
