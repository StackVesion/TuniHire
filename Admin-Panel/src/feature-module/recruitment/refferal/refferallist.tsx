import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { all_routes } from '../../router/all_routes';
import { Link } from 'react-router-dom';
import PredefinedDateRanges from '../../../core/common/datePicker';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { DatePicker } from "antd";
import CommonSelect from '../../../core/common/commonSelect';
import Table from "../../../core/common/dataTable/index";
import { refferallistDetails } from './refferallistDetails';
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';

interface Message {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  isRegisteredUser?: boolean;
}

interface TablePaginationConfig {
  pageSize: number;
  showSizeChanger: boolean;
  showTotal: (total: number, range: [number, number]) => string;
}

const RefferalList = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/contact/messages');
        setMessages(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  const data = refferallistDetails;
  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      render: (text: string) => new Date(text).toLocaleDateString(),
      sorter: (a: Message, b: Message) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      }
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (text: string, record: Message) => (
        <div className="d-flex align-items-center">
          <div>
            <h6 className="fw-medium">{record.name}</h6>
            {record.isRegisteredUser && (
              <span className="badge bg-success">Registered User</span>
            )}
          </div>
        </div>
      ),
      sorter: (a: Message, b: Message) => a.name.localeCompare(b.name)
    },
    {
      title: "Email",
      dataIndex: "email",
      sorter: (a: Message, b: Message) => a.email.localeCompare(b.email)
    },
    {
      title: "Subject",
      dataIndex: "subject",
      sorter: (a: Message, b: Message) => a.subject.localeCompare(b.subject)
    },
    {
      title: "Message",
      dataIndex: "message",
      render: (text: string) => (
        <div style={{ maxWidth: "300px", whiteSpace: "pre-wrap" }}>{text}</div>
      )
    }
  ];

  const paginationConfig = {
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total: number, range: [number, number]) => 
      `${range[0]}-${range[1]} of ${total} items`
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Newsletter</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Administration</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Newsletter
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="mb-2">
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-file-export me-1" />
                    Export
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        <i className="ti ti-file-type-pdf me-1" />
                        Export as PDF
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        <i className="ti ti-file-type-xls me-1" />
                        Export as Excel{" "}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          <div className="card">
            <div className="card-header">
              <h5>Contact Messages</h5>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Table 
                  dataSource={messages} 
                  columns={columns} 
                  Selection={false}
                  pagination={paginationConfig}
                />
              )}
            </div>
          </div>
        </div>
        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - 2025 © SmartHR.</p>
          <p>
            Designed &amp; Developed By{" "}
            <Link to="#" className="text-primary">
              Dreams
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default RefferalList;
