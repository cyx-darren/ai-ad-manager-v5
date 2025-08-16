import React from 'react';

const CampaignPerformanceTable = ({ campaigns, currency = 'SGD' }) => {
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const calculateStatus = (campaign) => {
    // Status based on CPA and conversion rate
    const conversionRate = campaign.sessions > 0 ? 
      (campaign.conversions / campaign.sessions) * 100 : 0;
    
    if (campaign.cpa > 200 || conversionRate < 1) return 'Critical';
    if (campaign.cpa < 50 && conversionRate > 2) return 'Excellent';
    return 'Good';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          Campaign Performance Details
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                Clicks (Billed)
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                Sessions
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                Cost ({currency})
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                Bounce Rate
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                Conversions
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                CPA
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns.map((campaign, index) => {
              const status = campaign.status || calculateStatus(campaign);
              const cpa = campaign.conversions > 0 ? 
                campaign.cost / campaign.conversions : 0;
              
              return (
                <tr key={campaign.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {campaign.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                    {campaign.clicks?.toLocaleString() || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                    {campaign.sessions?.toLocaleString() || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                    ${campaign.cost?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                    {campaign.bounceRate ? `${(campaign.bounceRate * 100).toFixed(2)}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-medium">
                    {campaign.conversions || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    ${cpa.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-6 py-3 text-sm font-bold text-gray-900">
                TOTAL
              </td>
              <td className="px-6 py-3 text-sm text-center font-bold text-gray-900">
                {campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0).toLocaleString()}
              </td>
              <td className="px-6 py-3 text-sm text-center font-bold text-gray-900">
                {campaigns.reduce((sum, c) => sum + (c.sessions || 0), 0).toLocaleString()}
              </td>
              <td className="px-6 py-3 text-sm text-right font-bold text-gray-900">
                ${campaigns.reduce((sum, c) => sum + (c.cost || 0), 0).toFixed(2)}
              </td>
              <td className="px-6 py-3 text-sm text-center font-bold text-gray-900">
                -
              </td>
              <td className="px-6 py-3 text-sm text-center font-bold text-gray-900">
                {campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0)}
              </td>
              <td className="px-6 py-3 text-sm text-right font-bold text-gray-900">
                -
              </td>
              <td className="px-6 py-3">
                {/* Empty cell for status column */}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default CampaignPerformanceTable;