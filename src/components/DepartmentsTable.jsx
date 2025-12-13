
const mockDepartments = [
  { id: 'CS', code: 'SCIS', name: 'School of Computer and Information Sciences', dean: 'Agnes R. Trillanes' },
  { id: 'CS', code: 'SCIS', name: 'School of Computer and Information Sciences', dean: 'Agnes R. Trillanes' },
  { id: 'CS', code: 'SCIS', name: 'School of Computer and Information Sciences', dean: 'Agnes R. Trillanes' },
  { id: 'CS', code: 'SCIS', name: 'School of Computer and Information Sciences', dean: 'Agnes R. Trillanes' },
  { id: 'CS', code: 'SCIS', name: 'School of Computer and Information Sciences', dean: 'Agnes R. Trillanes' },
]

const DepartmentsTable = ({ departments = mockDepartments }) => {
  return (
    <div style={{ width: '100%' }}>
      <table>
        <thead>
          <tr>
            <th width={150}>ID</th>
            <th width={200}>CODE</th>
            <th width={500}>NAME</th>
            <th width={250}>DEAN</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((d, idx) => (
            <tr key={idx}>
              <td width={150}>{d.id}</td>
              <td width={200}>{d.code}</td>
              <td width={500}>{d.name}</td>
              <td width={250}>{d.dean}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DepartmentsTable
