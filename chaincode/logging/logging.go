package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// LoggingContract provides functions for logging user events
type LoggingContract struct {
	contractapi.Contract
}

// LogEvent represents a user event log in the blockchain
type LogEvent struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	Action      string    `json:"action"`
	Resource    string    `json:"resource"`
	Timestamp   string    `json:"timestamp"`
	Description string    `json:"description"`
	Metadata    string    `json:"metadata,omitempty"`
}

// InitLedger adds a base set of logs to the ledger
func (s *LoggingContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	logs := []LogEvent{
		{
			ID:          "LOG0",
			UserID:      "user1",
			Action:      "VISIT",
			Resource:    "/home",
			Timestamp:   time.Now().Format(time.RFC3339),
			Description: "User visited home page",
		},
	}

	for _, log := range logs {
		logJSON, err := json.Marshal(log)
		if err != nil {
			return err
		}

		err = ctx.GetStub().PutState(log.ID, logJSON)
		if err != nil {
			return fmt.Errorf("failed to put to world state: %v", err)
		}
	}

	return nil
}

// CreateLog issues a new log to the world state with given details
func (s *LoggingContract) CreateLog(ctx contractapi.TransactionContextInterface, id string, userId string, action string, resource string, description string, metadata string) error {
	// Check if log already exists
	exists, err := s.LogExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("the log %s already exists", id)
	}

	log := LogEvent{
		ID:          id,
		UserID:      userId,
		Action:      action,
		Resource:    resource,
		Timestamp:   time.Now().Format(time.RFC3339),
		Description: description,
		Metadata:    metadata,
	}

	logJSON, err := json.Marshal(log)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, logJSON)
}

// ReadLog returns the log stored in the world state with given id
func (s *LoggingContract) ReadLog(ctx contractapi.TransactionContextInterface, id string) (*LogEvent, error) {
	logJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if logJSON == nil {
		return nil, fmt.Errorf("the log %s does not exist", id)
	}

	var log LogEvent
	err = json.Unmarshal(logJSON, &log)
	if err != nil {
		return nil, err
	}

	return &log, nil
}

// GetAllLogs returns all logs found in world state
func (s *LoggingContract) GetAllLogs(ctx contractapi.TransactionContextInterface) ([]*LogEvent, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var logs []*LogEvent
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var log LogEvent
		err = json.Unmarshal(queryResponse.Value, &log)
		if err != nil {
			return nil, err
		}
		logs = append(logs, &log)
	}

	return logs, nil
}

// GetLogsByUser returns all logs for a specific user
func (s *LoggingContract) GetLogsByUser(ctx contractapi.TransactionContextInterface, userId string) ([]*LogEvent, error) {
	queryString := fmt.Sprintf(`{"selector":{"userId":"%s"}}`, userId)
	return getQueryResultForQueryString(ctx, queryString)
}

// GetLogsByAction returns all logs for a specific action
func (s *LoggingContract) GetLogsByAction(ctx contractapi.TransactionContextInterface, action string) ([]*LogEvent, error) {
	queryString := fmt.Sprintf(`{"selector":{"action":"%s"}}`, action)
	return getQueryResultForQueryString(ctx, queryString)
}

// GetLogsByResource returns all logs for a specific resource
func (s *LoggingContract) GetLogsByResource(ctx contractapi.TransactionContextInterface, resource string) ([]*LogEvent, error) {
	queryString := fmt.Sprintf(`{"selector":{"resource":"%s"}}`, resource)
	return getQueryResultForQueryString(ctx, queryString)
}

// GetLogsByTimeRange returns all logs between two timestamps
func (s *LoggingContract) GetLogsByTimeRange(ctx contractapi.TransactionContextInterface, startTime string, endTime string) ([]*LogEvent, error) {
	queryString := fmt.Sprintf(`{"selector":{"timestamp":{"$gte":"%s","$lte":"%s"}}}`, startTime, endTime)
	return getQueryResultForQueryString(ctx, queryString)
}

// LogExists returns true when log with given ID exists in world state
func (s *LoggingContract) LogExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	logJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return logJSON != nil, nil
}

// Helper function for querying the ledger
func getQueryResultForQueryString(ctx contractapi.TransactionContextInterface, queryString string) ([]*LogEvent, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var logs []*LogEvent
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var log LogEvent
		err = json.Unmarshal(queryResponse.Value, &log)
		if err != nil {
			return nil, err
		}
		logs = append(logs, &log)
	}

	return logs, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&LoggingContract{})
	if err != nil {
		fmt.Printf("Error creating logging chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting logging chaincode: %s", err.Error())
	}
}
