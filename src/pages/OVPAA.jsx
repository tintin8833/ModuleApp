/**
 * OVPAA — Office of the Vice President for Academic Affairs.
 *
 * Wrapper page that hosts two sub-views, selected via `?page=`:
 *   - "Dashboard"       → AcademicTerms (default)
 *   - "Department List" → HRStaff (renamed sub-page; just renders departments)
 *
 * Mirrors the structure of Dean.jsx — SkeletonA outside, the inner
 * sub-page swaps based on the search param.
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import SkeletonA from '../layouts/SkeletonA.jsx';
import HeaderA from '../components/HeaderA.jsx';
import SideNavigation from '../components/SideNavigation.jsx';
import AcademicTerms from './AcademicTerms.jsx';
import HRStaff from './HRStaff.jsx';

const OVPAA = () => {
  const [searchParams] = useSearchParams();
  const page = searchParams.get('page') || 'Dashboard';

  const renderContent = () => {
    switch (page) {
      case 'Department List':
        return <HRStaff key="department-list" />;
      case 'Dashboard':
      // Back-compat: old links may still say "Academic Term".
      case 'Academic Term':
      default:
        return <AcademicTerms key="dashboard" />;
    }
  };

  return (
    <SkeletonA
      header={<HeaderA role="OVPAA" name="NORTON, MONICA" />}
      nav={<SideNavigation mode="ovpaa" />}
      content={renderContent()}
    />
  );
};

export default OVPAA;
