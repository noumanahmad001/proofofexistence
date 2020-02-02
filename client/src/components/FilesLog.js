import React, { Component } from 'react';
import {ListGroup, Container, Row, Col, Badge} from "react-bootstrap";
import moment from "moment";

class FilesLog extends Component {

    formatTags = (tags) => {
        if(tags.trim().length === 0) {
            return '';
        }
        const fileList = tags.split('-').map((tag) => {
            return (
                <Badge pill variant = "primary" style = {{ marginLeft: 0, marginTop: 5, marginBottom: 5, marginRight: 5, fontSize: 18 }} > {tag}</Badge>
            );
        });

        return fileList;
    }


    render() {
        const self = this;
        const files  = this.props.userFiles;
        const filesList = files.map( function(file, index) {
            return <ListGroup.Item key = {index}  onClick={()=> window.open("https://gateway.ipfs.io/ipfs/" + file.key, "_blank")}>
            <Row>
                <Col md = {2}>
                {index + 1})
                </Col>  
                <Col md = {10}>
                    <Row> {moment(file.timestamp, "x").format("DD MMM YYYY hh:mm a")}
                    </Row>
                    <Row> {self.formatTags(file.tags+'')}</Row>
                </Col>
            </Row>            
            </ListGroup.Item>
        });

        const textNoFile = "No files found for this user";
        return (

            <Container fluid>
                <Row> 
                    <Col md = {12}>
                    <h2> Files History </h2>
                    <hr />
                    </Col>    
                </Row>
                <Row>
                    <Col md = {12}>
                        {files.length ? 
                        <div>
                            To open file click on the file
                            <ListGroup>
                                {filesList} 
                            </ListGroup>
                        </div> :
                        textNoFile
                        }
                        
                    </Col>
                </Row>

            </Container>
            
        );
    }
}


export default FilesLog;