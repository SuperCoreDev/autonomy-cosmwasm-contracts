use thiserror::Error;


#[derive(Error, PartialEq, Debug)]
pub enum ContractError {
    #[error("Something went wrong")]
    BasicError {},
}